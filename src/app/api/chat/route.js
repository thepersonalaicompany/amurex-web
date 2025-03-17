// 1. Import Dependencies
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { BraveSearch } from "@langchain/community/tools/brave_search";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import fetch from 'node-fetch';
// 2. Initialize OpenAI and Supabase clients
const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Use OpenAI client for Groq
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// 3. Send payload to Supabase table
async function sendPayload(content, user_id) {
  await supabase
    .from("message_history")
    .insert([
      {
        payload: content,
        user_id: user_id,
      },
    ])
    .select("id");
}
// 4. Rephrase input using GPT
async function rephraseInput(inputString) {
  console.log("inputString", inputString);
//   const gptAnswer = await openai.chat.completions.create({
//     model: "gpt-4",
//     messages: [
//       {
//         role: "system",
//         content:
//           "You are a rephraser and always respond with a rephrased version of the input that is given to a search engine API. Always be succint and use the same words as the input.",
//       },
//       { role: "user", content: inputString },
//     ],
//   });
//   return gptAnswer.choices[0].message.content;
// }

// async function searchMemory(queryEmbedding, user_id) {
//   const { data: chunks, error } = await supabase.rpc(
//     "fafsearch_one",
//     {
//       query_embedding: queryEmbedding,
//       input_user_id: user_id,
//     }
//   );

//   if (error) throw error;
//   return chunks;
}

async function searchMemory(queryEmbedding, user_id) {
    const { data: chunks, error } = await supabase.rpc(
      "fafsearch_one",
      {
        query_embedding: queryEmbedding,
        input_user_id: user_id,
      }
    );

    if (error) throw error;
    return chunks;
}

async function searchDocuments(queryEmbedding, user_id, enabledSources) {
  const { data: documents, error } = await supabase.rpc(
    "fafsearch_two",
    {
      query_embedding: queryEmbedding,
      input_user_id: user_id,
      input_types: enabledSources
    }
  );

  if (error) throw error;
  return documents || []; // Ensure we return an empty array if no documents found
}

// 5. Search engine for sources
async function searchEngineForSources(message, internetSearchEnabled, user_id) {
  let combinedResults = [];

  // Perform Supabase document search
  const supabaseResults = await searchMemory(message, user_id);
  const supabaseData = supabaseResults.map((doc) => ({
    title: doc.title,
    link: doc.url,
    text: doc.text,
    relevantSections: doc.relevantSections,
  }));
  combinedResults = [...combinedResults, ...supabaseData];

  if (internetSearchEnabled) {
    const loader = new BraveSearch({
      apiKey: process.env.BRAVE_SEARCH_API_KEY,
    });
    const repahrasedMessage = await rephraseInput(message);
    const docs = await loader.call(repahrasedMessage);
    function normalizeData(docs) {
      return JSON.parse(docs)
        .filter(
          (doc) => doc.title && doc.link && !doc.link.includes("brave.com")
        )
        .slice(0, 6)
        .map(({ title, link }) => ({ title, link }));
    }
    const normalizedData = normalizeData(docs);
    combinedResults = [...combinedResults, ...normalizedData];
  }

  let vectorCount = 0;
  const fetchAndProcess = async (item) => {
    try {
      let htmlContent;
      if (item.text) {
        htmlContent = item.text;
      } else {
        const timer = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 1500)
        );
        const fetchPromise = fetchPageContent(item.link);
        htmlContent = await Promise.race([timer, fetchPromise]);
      }

      if (htmlContent.length < 250) return null;

      const splitText = await new RecursiveCharacterTextSplitter({
        chunkSize: 200,
        chunkOverlap: 0,
      }).splitText(htmlContent);

      // Get embeddings for each chunk of text
      const response = await fetch('https://api.mistral.ai/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          input: splitText,
          model: "mistral-embed",
          encoding_format: "float"
        })
      });

      const embedData = await response.json();
      const vectors = embedData.data.map(d => d.embedding);

      const vectorStore = await MemoryVectorStore.fromVectors(
        vectors,
        splitText,
        { annotationPosition: item.link }
      );
      vectorCount++;
      return await vectorStore.similaritySearch(message, 1);
    } catch (error) {
      console.log(`Failed to process content for ${item.link}, skipping!`);
      vectorCount++;
      return null;
    }
  };

  const results = await Promise.all(combinedResults.map(fetchAndProcess));
  const successfulResults = results.filter((result) => result !== null);
  const topResult = successfulResults.length > 4 ? successfulResults.slice(0, 4) : successfulResults;
  console.log("topResult", topResult);

  // After getting search results, generate response
  const modelName = process.env.MODEL_NAME;
  const messages = [
    {
      role: "system",
      content: "You are a helpful assistant. Use the provided search results to answer the user's query. If the search results don't contain relevant information, provide a general response based on your knowledge.",
    },
    {
      role: "user",
      content: `Query: ${message}\n\nSearch Results: ${JSON.stringify(topResult)}`,
    },
  ];

  const gptResponse = await generateCompletion(messages, modelName);

  return {
    sources: combinedResults,
    vectorResults: topResult,
    answer: gptResponse.choices[0].message.content
  };
}
// 25. Define fetchPageContent function
async function fetchPageContent(link) {
  const response = await fetch(link);
  return extractMainContent(await response.text());
}
// 26. Define extractMainContent function
function extractMainContent(html) {
  const $ = cheerio.load(html);
  $("script, style, head, nav, footer, iframe, img").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}
// 27. Define triggerLLMAndFollowup function
async function triggerLLMAndFollowup(inputString, user_id) {
  // Pass user_id to getGPTResults
  await getGPTResults(inputString, user_id);
  // Generate follow-up with generateFollowup
  const followUpResult = await generateFollowup(inputString);
  // Send follow-up payload with user_id
  await sendPayload({ type: "FollowUp", content: followUpResult }, user_id);
  return Response.json({ message: "Processing request" });
}
// 32. Define getGPTResults function
const getGPTResults = async (inputString, user_id) => {
  let accumulatedContent = "";
  // 34. Open a streaming connection with OpenAI
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a answer generator, you will receive top results of similarity search, they are optional to use depending how well they help answer the query.",
      },
      { role: "user", content: inputString },
    ],
    stream: true,
  });

  // Create initial row with user_id
  // TODO: Why?
  let rowId = await createRowForGPTResponse(user_id);
  // Send initial payload with user_id
  await sendPayload({ type: "Heading", content: "Answer" }, user_id);

  for await (const part of stream) {
    // 38. Check if delta content exists
    if (part.choices[0]?.delta?.content) {
      // 39. Accumulate the content
      accumulatedContent += part.choices[0]?.delta?.content;
      // Update row with user_id
      rowId = await updateRowWithGPTResponse(
        rowId,
        accumulatedContent,
        user_id
      );
    }
  }
};

// 41. Define createRowForGPTResponse function
const createRowForGPTResponse = async (user_id) => {
  const streamId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const payload = { type: "GPT", content: "" };
  const { data, error } = await supabase
    .from("message_history")
    .insert([{ payload, user_id }])
    .select("id");
  return { id: data ? data[0].id : null, streamId };
};

// 46. Define updateRowWithGPTResponse function
const updateRowWithGPTResponse = async (prevRowId, content, user_id) => {
  const payload = { type: "GPT", content };
  await supabase.from("message_history").delete().eq("id", prevRowId);
  const { data } = await supabase
    .from("message_history")
    .insert([{ payload, user_id }])
    .select("id");
  return data ? data[0].id : null;
};

// 51. Define generateFollowup function
async function generateFollowup(message) {
  const modelName = process.env.MODEL_NAME;
  const messages = [
    {
      role: "system",
      content: `You are a follow up answer generator and always respond with 4 follow up questions based on this input "${message}" in JSON format. i.e. { "follow_up": ["QUESTION_GOES_HERE", "QUESTION_GOES_HERE", "QUESTION_GOES_HERE"] }`,
    },
    {
      role: "user",
      content: `Generate a 4 follow up questions based on this input ""${message}"" `,
    },
  ];

  if (modelName === 'llama3.3') {
    // Use Ollama API
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.3-70b',
        messages: messages,
        stream: false
      }),
    });
    
    const data = await response.json();
    return data.message.content;
  } else {
    // Use OpenAI
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    });
    return chatCompletion.choices[0].message.content;
  }
}

// Add this new function near the other helper functions
async function generatePrompts(documents) {
  const modelName = process.env.MODEL_NAME;
  const messages = [
    {
      role: "system",
      content: "You are a prompt generator. Keep the prompts super short and concise. Given document titles and content, generate 2 interesting questions and 1 email action. Make the prompts engaging and focused on extracting key insights from the documents. Return a JSON object with a 'prompts' array containing exactly 3 objects. Example format: { 'prompts': [{'type': 'prompt', 'text': 'What are the key findings...?'}, {'type': 'prompt', 'text': 'How does this compare...?'}, {'type': 'email', 'text': 'Draft an email to summarize...'}] }",
    },
    {
      role: "user",
      content: `Generate 3 prompts based on these documents: ${JSON.stringify(documents)}`,
    },
  ];

  if (modelName === 'llama3.3') {
    // Use Ollama API
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.3-70b',
        messages: messages,
        stream: false
      }),
    });
    
    const data = await response.json();
    return JSON.parse(data.message.content);
  } else {
    // Use OpenAI
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: { type: "json_object" }
    });
    return JSON.parse(gptResponse.choices[0].message.content);
  }
}

// Function to check which model to use and make the appropriate API call
async function generateCompletion(messages, modelName) {
  // Check if we should use Ollama
  if (modelName === 'llama3.3') {
    // Use Ollama API
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.3-70b',
        messages: messages,
        stream: false
      }),
    });
    
    const data = await response.json();
    return {
      choices: [
        {
          message: {
            content: data.message.content
          }
        }
      ]
    };
  } else {
    // Use OpenAI
    return await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    });
  }
}

// Replace the searchMemory and searchDocuments functions with a unified search function
async function searchBrain(query, user_id, enabledSources) {
  try {
    // const response = await fetch('https://brain.amurex.ai/search', {
    const response = await fetch('http://localhost:8080/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BRAIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user_id,
        content_type: "document",
        query: query,
        search_type: "hybrid",
        ai_enabled: false,
        limit: 3,
        offset: 0,
        sources: enabledSources
      })
    });

    if (!response.ok) {
      throw new Error(`Brain search failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching brain:', error);
    throw error;
  }
}

// Modify the POST function to remove search time tracking
export async function POST(req) {
  const startTime = performance.now();
  console.log("POST request started at:", new Date().toISOString());
  
  const body = await req.json();
  console.log(`[${performance.now() - startTime}ms] Request parsed`);
  
  // Log the entire request payload
  // Handle prompts generation
  if (body.type === 'prompts') {
    try {
      const promptsStartTime = performance.now();
      const prompts = await generatePrompts(body.documents);
      console.log(`[${performance.now() - promptsStartTime}ms] Prompts generated`);
      return Response.json({ prompts });
    } catch (error) {
      console.error('Error generating prompts:', error);
      return Response.json({ error: 'Failed to generate prompts' }, { status: 500 });
    }
  }
  
  // Original chat functionality continues here...
  const { message, user_id, googleDocsEnabled, notionEnabled, memorySearchEnabled, obsidianEnabled } = body;
  
  if (!user_id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sourcesStartTime = performance.now();
    // Create unified list of enabled sources for document search
    const enabledSources = [
      ...(googleDocsEnabled ? ['google_docs'] : []),
      ...(notionEnabled ? ['notion'] : []),
      ...(obsidianEnabled ? ['obsidian'] : [])
    ];
    console.log(`[${performance.now() - sourcesStartTime}ms] Sources configured`);

    if (enabledSources.length === 0 && !memorySearchEnabled) {
      return Response.json({ 
        success: false, 
        error: "No sources enabled for search" 
      }, { status: 400 });
    }
    
    // Run searches in parallel if both are enabled
    const searchStartTime = performance.now();
    const searchPromises = [];
    let brainResults = [];
    let meetingsResults = [];
    let queryEmbedding;
    
    // Add brain search promise if document sources are enabled
    if (enabledSources.length > 0) {
      const brainSearchPromise = searchBrain(message, user_id, enabledSources)
        .then(results => {
          console.log(`[${performance.now() - searchStartTime}ms] Brain search completed`);
          brainResults = results;
        });
      searchPromises.push(brainSearchPromise);
    }
    
    // Add memory search promise if memory search is enabled
    if (memorySearchEnabled) {
      // First get embeddings (this needs to be done before the actual search)
      const embedPromise = fetch('https://api.mistral.ai/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          input: [message],
          model: "mistral-embed",
          encoding_format: "float"
        })
      })
      .then(response => response.json())
      .then(embedData => {
        console.log(`[${performance.now() - searchStartTime}ms] Embeddings generated`);
        queryEmbedding = embedData.data[0].embedding;
        
        // Now do the actual memory search with the embedding
        return searchMemory(queryEmbedding, user_id);
      })
      .then(results => {
        console.log(`[${performance.now() - searchStartTime}ms] Memory search completed`);
        meetingsResults = results;
      });
      
      searchPromises.push(embedPromise);
    }
    
    // Wait for all search operations to complete
    await Promise.all(searchPromises);
    console.log(`[${performance.now() - searchStartTime}ms] All searches completed`);
    
    // Process all results
    let allResults = [...brainResults];
    
    // Format meeting results to match brain results structure
    if (memorySearchEnabled && meetingsResults.length > 0) {
      const formattedMeetingResults = meetingsResults.map(meeting => ({
        id: meeting.meeting_id,
        user_id: user_id,
        url: `/meetings/${meeting.meeting_id}`,
        title: meeting.title || "Meeting Transcript",
        text: meeting.content,
        type: "meeting"
      }));

      allResults = [...allResults, ...formattedMeetingResults];
    }
    
    // Prepare unified sources list
    const sourcesProcessStartTime = performance.now();
    const sources = allResults.map(result => ({
      id: result.id,
      text: result.text,
      title: result.title,
      url: result.url,
      type: result.type || 'document'
    }));
    console.log(`[${performance.now() - sourcesProcessStartTime}ms] Sources processed`);
    
    // Create streaming response
    const streamSetupStartTime = performance.now();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    const modelName = process.env.MODEL_NAME;
    console.log(`[${performance.now() - streamSetupStartTime}ms] Stream setup completed`);

    // Process the stream using Groq via OpenAI client
    (async () => {
      try {
        let fullResponse = ''; // Track complete response

        // Send sources first - removed search time information
        const sourcesWriteStartTime = performance.now();
        const sourcesPayload = JSON.stringify({
          success: true,
          sources: sources,
          chunk: ''
        });
        await writer.write(encoder.encode(sourcesPayload + '\n'));
        console.log(`[${performance.now() - sourcesWriteStartTime}ms] Sources written to stream`);

        // Use Groq for streaming (via OpenAI client)
        const groqStartTime = performance.now();
        console.log("Starting Groq stream at:", new Date().toISOString());
        const groqStream = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant. Use the provided document chunks to answer the user's query. If the chunks don't contain relevant information, let the user know you couldn't find specific information about their query. Be confident in your answer. Don't say 'I'm not sure' or 'I don't know'.",
            },
            {
              role: "user",
              content: `Query: ${message}
              
              Retrieved documents: ${JSON.stringify(allResults.map(result => ({
                title: result.title,
                text: result.text
              })))}`,
            },
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.5,
          max_tokens: 1024,
          top_p: 1,
          stream: true,
        });
        console.log(`[${performance.now() - groqStartTime}ms] Groq stream created`);

        const streamProcessStartTime = performance.now();
        let chunkCount = 0;
        for await (const chunk of groqStream) {
          chunkCount++;
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content; // Accumulate the response
            const payload = JSON.stringify({
              success: true,
              chunk: content,
            });
            await writer.write(encoder.encode(payload + '\n'));
          }
        }
        console.log(`[${performance.now() - streamProcessStartTime}ms] Stream processed (${chunkCount} chunks)`);
        console.log("Groq stream completed at:", new Date().toISOString());

        // fetch the user's table and find if "memory_enabled" is true
        const dbStartTime = performance.now();
        const { data: user, error } = await supabase.from('users').select('memory_enabled').eq('id', user_id).single();
        
        if (user.memory_enabled) {
          // fetch the user's memory table and find if "memory_enabled" is true
          const sessionInsertStartTime = performance.now();
          await supabase.from('sessions').insert({
            user_id: user_id,
            query: message,
            response: fullResponse,
            sources: sources,
          });
          console.log(`[${performance.now() - sessionInsertStartTime}ms] Session inserted into database`);
        } else {
          console.log("Memory is not enabled for this user", error);
        }
        console.log(`[${performance.now() - dbStartTime}ms] Database operations completed`);

        // Send final message
        const finalWriteStartTime = performance.now();
        const finalPayload = JSON.stringify({
          success: true,
          done: true,
        });
        await writer.write(encoder.encode(finalPayload + '\n'));
        console.log(`[${performance.now() - finalWriteStartTime}ms] Final message written to stream`);
      } catch (error) {
        console.error('Error in Groq stream processing:', error);
        const errorPayload = JSON.stringify({
          success: false,
          error: error.message,
        });
        await writer.write(encoder.encode(errorPayload + '\n'));
      } finally {
        await writer.close();
        console.log(`[${performance.now() - startTime}ms] Total request processing time`);
        console.log("POST request completed at:", new Date().toISOString());
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error(`Error processing query:`, error);
    console.log(`[${performance.now() - startTime}ms] Request failed with error`);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
