// 1. Import Dependencies
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { BraveSearch } from "@langchain/community/tools/brave_search";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
// 2. Initialize OpenAI and Supabase clients
const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
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
  const gptAnswer = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a rephraser and always respond with a rephrased version of the input that is given to a search engine API. Always be succint and use the same words as the input.",
      },
      { role: "user", content: inputString },
    ],
  });
  return gptAnswer.choices[0].message.content;
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
  console.log("queryEmbedding", queryEmbedding);
  const { data: documents, error } = await supabase.rpc(
    "fafsearch_two",
    {
      query_embedding: queryEmbedding,
      input_user_id: user_id,
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

  // After getting search results, generate GPT response
  const gptResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant. Use the provided search results to answer the user's query. If the search results don't contain relevant information, provide a general response based on your knowledge.",
      },
      {
        role: "user",
        content: `Query: ${message}\n\nSearch Results: ${JSON.stringify(topResult)}`,
      },
    ],
  });

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
  // 52. Create chat completion with OpenAI API
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a follow up answer generator and always respond with 4 follow up questions based on this input "${message}" in JSON format. i.e. { "follow_up": ["QUESTION_GOES_HERE", "QUESTION_GOES_HERE", "QUESTION_GOES_HERE"] }`,
      },
      {
        role: "user",
        content: `Generate a 4 follow up questions based on this input ""${message}"" `,
      },
    ],
    model: "gpt-4o",
  });
  // 53. Return the content of the chat completion
  return chatCompletion.choices[0].message.content;
}
// 54. Define POST function for API endpoint
export async function POST(req, res) {
  const { message, user_id, googleDocsEnabled, notionEnabled, memorySearchEnabled, obsidianEnabled } = await req.json();

  if (!user_id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Start timing
    const searchStart = performance.now();
    
    // Create unified list of enabled sources
    const enabledSources = [
      ...(googleDocsEnabled ? ['google_docs'] : []),
      ...(notionEnabled ? ['notion'] : []),
      ...(obsidianEnabled ? ['obsidian'] : []),
      ...(memorySearchEnabled ? ['memory'] : [])
    ];

    if (enabledSources.length === 0) {
      return Response.json({ 
        success: false, 
        error: "No sources enabled for search" 
      }, { status: 400 });
    }

    // Get embedding for query
    const response = await fetch('https://api.mistral.ai/v1/embeddings', {
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
    });
  
    const embedData = await response.json();
    const queryEmbedding = embedData.data[0].embedding;
    
    // Get all relevant sources based on enabled types
    const [memoryChunks, documentChunks] = await Promise.all([
      enabledSources.includes('memory') ? searchMemory(queryEmbedding, user_id) : [],
      enabledSources.some(source => ['google_docs', 'notion', 'obsidian'].includes(source)) 
        ? searchDocuments(queryEmbedding, user_id, enabledSources.filter(source => source !== 'memory'))
        : []
    ]);
    
    // End timing and log
    const searchEnd = performance.now();
    console.log(`Search completed in ${searchEnd - searchStart}ms`);
    
    // Format all chunks uniformly
    const formattedChunks = [
      ...memoryChunks.map(item => item.content),
      ...documentChunks.map(doc => doc.selected_chunks || []).flat()
    ];

    // Prepare unified sources list
    const sources = [
      ...memoryChunks.map(item => ({
        text: item.content,
        meeting_id: item.meeting_id,
        url: item.meeting_id ? `/meetings/${item.meeting_id}` : null
      })),
      ...documentChunks.map(doc => ({
        text: doc.selected_chunks?.join('\n') || '',
        title: doc.title,
        url: doc.url,
        type: doc.type
      }))
    ];

    // Create streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    console.log("documentChunks", documentChunks);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Use the provided document chunks to answer the user's query. If the chunks don't contain relevant information, let the user know you couldn't find specific information about their query. Be confident in your answer. Don't say 'I'm not sure' or 'I don't know'.",
        },
        {
          role: "user",
          content: `Query: ${message};
          
                  Retrieved chunks from online conversations: ${JSON.stringify(formattedChunks)}
          
                  Retrieved chunks from documents (from files): ${JSON.stringify(documentChunks.map(doc => ({
            title: doc.title,
            content: doc.selected_chunks
          })))}`,
        },
      ],
      stream: true,
    });

    // Process the stream
    (async () => {
      try {
        // Send sources first
        const sourcesPayload = JSON.stringify({
          success: true,
          sources: sources,
          chunk: ''
        });
        await writer.write(encoder.encode(sourcesPayload + '\n'));

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            const payload = JSON.stringify({
              success: true,
              chunk: content,
            });
            await writer.write(encoder.encode(payload + '\n'));
          }
        }

        // Send final message
        const finalPayload = JSON.stringify({
          success: true,
          done: true,
        });
        await writer.write(encoder.encode(finalPayload + '\n'));
      } catch (error) {
        const errorPayload = JSON.stringify({
          success: false,
          error: error.message,
        });
        await writer.write(encoder.encode(errorPayload + '\n'));
      } finally {
        await writer.close();
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
    console.error('Error processing query:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
