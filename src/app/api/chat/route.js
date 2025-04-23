// 1. Import Dependencies
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { BraveSearch } from "@langchain/community/tools/brave_search";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import fetch from 'node-fetch';
// 2. Initialize admin Supabase client with service role key
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Use OpenAI client for Groq
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// 3. Send payload to Supabase table
async function sendPayload(content, user_id) {
  await adminSupabase
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
  const gptAnswer = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
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
    const { data: chunks, error } = await adminSupabase.rpc(
      "fafsearch_main",
      {
        query_embedding: queryEmbedding,
        input_user_id: user_id,
      }
    );

    console.log("chunks", chunks);

    if (error) throw error;
    return chunks;
}

async function searchDocuments(queryEmbedding, user_id, enabledSources) {
  const { data: documents, error } = await adminSupabase.rpc(
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
  // 34. Open a streaming connection with Groq
  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
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
  const { data, error } = await adminSupabase
    .from("message_history")
    .insert([{ payload, user_id }])
    .select("id");
  return { id: data ? data[0].id : null, streamId };
};

// 46. Define updateRowWithGPTResponse function
const updateRowWithGPTResponse = async (prevRowId, content, user_id) => {
  const payload = { type: "GPT", content };
  await adminSupabase.from("message_history").delete().eq("id", prevRowId);
  const { data } = await adminSupabase
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
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        stream: false
      }),
    });
    
    const data = await response.json();
    return data.message.content;
  } else {
    // Use Groq
    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        stream: false
      }),
    });
    
    const data = await response.json();
    return JSON.parse(data.message.content);
  } else {
    // Use Groq
    const gptResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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
        model: 'llama-3.3-70b-versatile',
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
    // Use Groq
    return await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
    });
  }
}

// Add this function to search using the Brain API
async function searchBrain(query, user_id, enabledSources) {
  try {
    const response = await fetch('https://brain.amurex.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BRAIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user_id,
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
    console.log("data", data);
    return data.results || [];
  } catch (error) {
    console.error('Error searching brain:', error);
    throw error;
  }
}

// Add this new function to determine the message intent
async function determineMessageIntent(message) {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are the first layer of the Amurex AI agent. The second layer can perform tasks such as searching through the user's documents, emails, and meeting notes, or engaging in casual conversation. Your task is to analyze the user's message and determine its intent. Based on the intent, respond with a JSON object indicating one of the following types:
- "search": The user is attempting to retrieve information from their documents, emails, or meeting notes.
- "chat": The user is casually conversing, asking general questions, or making small talk.
- "my_info": The user is asking about what the AI knows about them.
- "ai_info": The user is asking about the AI possibilities itself.
- "unsupported": The user is trying to initiate an action that is not currently supported. For now, only support search and casual chat. Can't take any actions or do anything on the user's behalf.

Your response should be a single JSON object. Types of potential user messages include:
"who are you" → {"type": "ai_info"},
"what do you know about me" → {"type": "my_info"},
"find my last meeting with John" → {"type": "search"},
"book a flight to New York" → {"type": "unsupported"},
"how's your day going?" → {"type": "chat"}`
        },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error determining message intent:", error);
    // Default to search if there's an error
    return { type: "search" };
  }
}

// Add this function to handle casual chat
async function handleCasualChat(message, messageHistory) {
  try {
    // Format the conversation history for the model
    const formattedHistory = messageHistory ? messageHistory
      .filter(msg => msg.payload.content.trim() !== '') // Filter out empty messages
      .map(msg => ({
        role: msg.payload.type === 'user' ? 'user' : 'assistant',
        content: msg.payload.content
      })) : [];
    
    // Create the messages array with system prompt, history, and current query
    const messages = [
      {
        role: "system",
        content: `You are Amurex, a helpful AI productivity assistant. You're engaging in casual conversation with the user. Be friendly, helpful, and conversational. You can discuss general topics, answer questions about the world, or engage in small talk.

When asked "Who are you?" or "What can you do?", introduce yourself as Amurex and describe your core features:
- AI meeting assistant (live insights, summaries, transcripts)
- Smart search across tools like Notion, Google Drive, and more
- Inbox organizer and email prioritizer

Highlight your privacy focus, open-source nature, and ability to be self-hosted.
Tone: friendly, smart, maybe a little witty — like a dependable teammate who's always on.`,
      },
      // Add conversation history
      ...formattedHistory,
      {
        role: "user",
        content: message
      },
    ];
    
    const chatResponse = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    });
    
    return chatResponse.choices[0].message.content;
  } catch (error) {
    console.error("Error in casual chat:", error);
    return "I'm having trouble processing that right now. Could you try again?";
  }
}

// Add this function to handle AI information requests
async function handleAiInfo(message, messageHistory) {
  try {
    // Format the conversation history for the model
    const formattedHistory = messageHistory ? messageHistory
      .filter(msg => msg.payload.content.trim() !== '') // Filter out empty messages
      .map(msg => ({
        role: msg.payload.type === 'user' ? 'user' : 'assistant',
        content: msg.payload.content
      })) : [];
    
    // Create the messages array with system prompt, history, and current query
    const messages = [
      {
        role: "system",
        content: `You are Amurex, an AI productivity assistant. The user is asking about your capabilities, features, or how you work. Provide a helpful, informative response about yourself.

Key information about Amurex:
- Core features:
  1. AI meeting assistant: Provides live insights during meetings, creates summaries, and stores searchable transcripts
  2. Smart search: Searches across connected tools like Notion, Google Drive, Gmail, and Obsidian
  3. Inbox organizer: Helps prioritize and manage emails
  
- Technical capabilities:
  - Can process and understand natural language
  - Can search through user's documents, emails, and meeting notes
  - Can engage in casual conversation
  - Can provide contextual responses based on previous interactions
  
- Privacy and security:
  - Privacy-focused design
  - Open-source and can be self-hosted
  - User data is not used for training
  
- Limitations:
  - Cannot take actions on behalf of the user (like booking flights or sending emails)
  - Cannot access information that hasn't been connected to Amurex
  - Cannot browse the web in real-time

Respond in a friendly, helpful tone. Be concise but comprehensive.`,
      },
      // Add conversation history
      ...formattedHistory,
      {
        role: "user",
        content: message
      },
    ];
    
    const aiInfoResponse = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    });
    
    return aiInfoResponse.choices[0].message.content;
  } catch (error) {
    console.error("Error in AI info response:", error);
    return "I'm Amurex, your AI productivity assistant. I can help search your documents, summarize meetings, and organize your inbox. I'm privacy-focused, open-source, and designed to make your work life easier.";
  }
}

// Add this function to handle unsupported requests
async function handleUnsupported(message, messageHistory) {
  try {
    // Format the conversation history for the model
    const formattedHistory = messageHistory ? messageHistory
      .filter(msg => msg.payload.content.trim() !== '') // Filter out empty messages
      .map(msg => ({
        role: msg.payload.type === 'user' ? 'user' : 'assistant',
        content: msg.payload.content
      })) : [];
    
    // Create the messages array with system prompt, history, and current query
    const messages = [
      {
        role: "system",
        content: `You are Amurex, an AI productivity assistant. The user has requested an action that you cannot currently perform. Explain politely that you cannot perform this action, and suggest alternatives if possible.

Current limitations:
- Cannot take actions on behalf of the user (like booking flights, sending emails, or scheduling meetings)
- Cannot access systems or applications that haven't been connected to Amurex
- Cannot make purchases or handle financial transactions
- Cannot browse the web in real-time
- Cannot modify or create files directly

What you CAN do:
- Search through connected documents, emails, and meeting notes
- Provide information and answer questions
- Engage in conversation
- Offer suggestions and advice

Be empathetic and helpful in your response. Acknowledge the user's request, explain why you can't fulfill it, and suggest alternatives when possible.`,
      },
      // Add conversation history
      ...formattedHistory,
      {
        role: "user",
        content: message
      },
    ];
    
    const unsupportedResponse = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    });
    
    return unsupportedResponse.choices[0].message.content;
  } catch (error) {
    console.error("Error in unsupported response:", error);
    return "I'm sorry, but I can't perform that action. As an AI assistant, I'm currently limited to searching your documents, answering questions, and engaging in conversation. I can't take actions on your behalf like booking flights, sending emails, or making changes to your systems.";
  }
}

// Modify the POST function to handle the new intent types
export async function POST(req) {
  try {
    const { message, googleDocsEnabled, notionEnabled, memorySearchEnabled, obsidianEnabled, gmailEnabled, user_id, type, documents, messageHistory } = await req.json();
    
    // Handle prompt generation request
    if (type === "prompts") {
      // Generate prompt suggestions based on documents
      let promptSuggestions = [];
      
      try {
        if (documents && documents.length > 0) {
          // Use the existing generatePrompts function to create suggestions
          const promptData = await generatePrompts(documents);
          promptSuggestions = promptData.prompts || [];
        } else {
          // Default prompts if no documents are provided
          promptSuggestions = [
            { type: "prompt", text: "What can you help me with?" },
            { type: "prompt", text: "Summarize my recent documents" },
            { type: "prompt", text: "What meetings do I have scheduled today?" }
          ];
        }
      } catch (error) {
        console.error("Error generating prompts:", error);
        // Fallback prompts in case of error
        promptSuggestions = [
          { type: "prompt", text: "How can you assist me?" },
          { type: "prompt", text: "Tell me about Amurex features" },
          { type: "prompt", text: "Search my documents for important information" }
        ];
      }
      
      return Response.json({ prompts: promptSuggestions });
    }
    
    // Determine the intent of the message
    const intent = await determineMessageIntent(message);
    console.log("Message intent:", intent);
    
    // Create a new ReadableStream for streaming the response
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const writer = {
          write: (data) => controller.enqueue(data),
          close: () => controller.close(),
          abort: (reason) => controller.error(reason),
        };
        
        (async () => {
          try {
            let fullResponse = ''; // Track complete response
            
            // Handle based on intent type
            if (intent.type === "search") {
              // Record search start time
              const searchStartTime = performance.now();
              
              // Create a list of enabled source types for the search
              const enabledSourceTypes = [];
              if (googleDocsEnabled) enabledSourceTypes.push('google_docs');
              if (notionEnabled) enabledSourceTypes.push('notion');
              if (obsidianEnabled) enabledSourceTypes.push('obsidian');
              if (gmailEnabled) enabledSourceTypes.push('email');
              
              console.log("search query", message);
              // Search for documents using the Brain API
              let brainResults = [];
              if (enabledSourceTypes.length > 0) {
                brainResults = await searchBrain(message, user_id, enabledSourceTypes);
              }
              
              // Search for meeting transcripts if enabled
              let meetingsResults = [];
              if (memorySearchEnabled) {
                // First get embeddings
                const embedResponse = await fetch('https://api.mistral.ai/v1/embeddings', {
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
                
                const embedData = await embedResponse.json();
                const queryEmbedding = embedData.data[0].embedding;
                
                // Now do the actual memory search with the embedding
                meetingsResults = await searchMemory(queryEmbedding, user_id);
              }
              
              // Process all results
              let allResults = [...brainResults];
              if (meetingsResults.length > 0) {
                allResults = [...allResults, ...meetingsResults];
              }
              
              // Sort results by relevance score (descending)
              allResults.sort((a, b) => (b.score || 0) - (a.score || 0));
              
              // Limit to top results
              const topResults = allResults.slice(0, 5);
              
              // Calculate search time
              const searchEndTime = performance.now();
              const searchTimeMs = searchEndTime - searchStartTime;
              console.log(`Search completed in ${searchTimeMs}ms`);
              
              // First, send the sources to the client
              const sourcesPayload = JSON.stringify({
                success: true,
                sources: topResults.map(result => ({
                  title: result.title || (result.type === "email" ? result.subject : "Document"),
                  url: result.url || "#",
                  type: result.type || "document"
                })),
                chunk: ''
              });
              await writer.write(encoder.encode(sourcesPayload + '\n'));
              
              // Format documents for the LLM
              const formattedDocuments = topResults.map(result => {
                if (result.type === "email") {
                  return {
                    title: result.subject || "Email",
                    text: result.text,
                    type: "email",
                    date: result.received_at ? new Date(result.received_at).toLocaleDateString() : "Unknown date"
                  };
                } else if (result.type === "meeting") {
                  return {
                    title: result.title || "Meeting Transcript",
                    text: result.text,
                    type: "meeting"
                  };
                } else {
                  return {
                    title: result.title,
                    text: result.text,
                    type: result.type || "document"
                  };
                }
              });
              
              // Format the conversation history for the model
              const formattedHistory = messageHistory ? messageHistory
                .filter(msg => msg.payload.content.trim() !== '') // Filter out empty messages
                .map(msg => ({
                  role: msg.payload.type === 'user' ? 'user' : 'assistant',
                  content: msg.payload.content
                })) : [];
              
              // Create the messages array with system prompt, history, and current query
              const messages = [
                {
                  role: "system",
                  content: `You are Amurex, a helpful AI productivity assistant. Use the provided document chunks to answer the user's query. If the chunks don't contain relevant information, generate a confident and plausible answer anyway — do not say "I'm not sure" or "I don't know." Be helpful, contextual, and confident.

Behavior Guidelines:

                  1. When No Documents Are Found:
                  - Confidently make up a helpful (but very short!) answer if needed.
                  - You can mention you're improvising if appropriate, but do so smoothly.
                  - Example: "I couldn't find anything directly, but here's what I think might help…"

                  2. When Asked "Who are you?" or "What can you do?":
                  - Don't say that you were not able to find anything in the documents. Just introduce yourself as Amurex and describe your core features:
                    - AI meeting assistant (live insights, summaries, transcripts)
                    - Smart search across tools like Notion, Google Drive, and more
                    - Inbox organizer and email prioritizer
                  - Highlight your privacy focus, open-source nature, and ability to be self-hosted.
                  - Tone: friendly, smart, maybe a little witty — like a dependable teammate who's always on.

                  Always aim to be helpful, aware, and resourceful — even if you have to fake it a bit.`,
                },
                // Add conversation history
                ...formattedHistory,
                {
                  role: "user",
                  content: `Query: ${message}
                  
                  Retrieved documents: ${JSON.stringify(formattedDocuments)}`,
                },
              ];
              
              // Send search time information in a separate chunk
              const searchTimePayload = JSON.stringify({
                success: true,
                searchTime: (searchTimeMs / 1000).toFixed(2),
                chunk: ''
              });
              await writer.write(encoder.encode(searchTimePayload + '\n'));
              
              // Use Groq for streaming
              const groqStream = await groq.chat.completions.create({
                messages: messages,
                model: "llama-3.3-70b-versatile",
                temperature: 0.5,
                max_tokens: 1024,
                top_p: 1,
                stream: true,
              });
              
              for await (const chunk of groqStream) {
                const content = chunk.choices[0]?.delta?.content || '';
                fullResponse += content;
                
                // Send each chunk to the client
                const payload = JSON.stringify({
                  success: true,
                  chunk: content
                });
                await writer.write(encoder.encode(payload + '\n'));
              }
            } else if (intent.type === "ai_info") {
              // Handle AI information requests
              const response = await handleAiInfo(message, messageHistory);
              
              // Send empty sources first (no sources for AI info)
              const sourcesPayload = JSON.stringify({
                success: true,
                sources: [],
                chunk: ''
              });
              await writer.write(encoder.encode(sourcesPayload + '\n'));
              
              // Stream the response in smaller chunks
              const chunkSize = 10;
              for (let i = 0; i < response.length; i += chunkSize) {
                const chunk = response.substring(i, i + chunkSize);
                const payload = JSON.stringify({
                  success: true,
                  chunk: chunk
                });
                await writer.write(encoder.encode(payload + '\n'));
                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            } else if (intent.type === "unsupported") {
              // Handle unsupported requests
              const response = await handleUnsupported(message, messageHistory);
              
              // Send empty sources first (no sources for unsupported)
              const sourcesPayload = JSON.stringify({
                success: true,
                sources: [],
                chunk: ''
              });
              await writer.write(encoder.encode(sourcesPayload + '\n'));
              
              // Stream the response in smaller chunks
              const chunkSize = 10;
              for (let i = 0; i < response.length; i += chunkSize) {
                const chunk = response.substring(i, i + chunkSize);
                const payload = JSON.stringify({
                  success: true,
                  chunk: chunk
                });
                await writer.write(encoder.encode(payload + '\n'));
                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            } else {
              // Handle casual chat or other intents (default case)
              const response = await handleCasualChat(message, messageHistory);
              
              // Send empty sources first (no sources for casual chat)
              const sourcesPayload = JSON.stringify({
                success: true,
                sources: [],
                chunk: ''
              });
              await writer.write(encoder.encode(sourcesPayload + '\n'));
              
              // Stream the response in smaller chunks
              const chunkSize = 10;
              for (let i = 0; i < response.length; i += chunkSize) {
                const chunk = response.substring(i, i + chunkSize);
                const payload = JSON.stringify({
                  success: true,
                  chunk: chunk
                });
                await writer.write(encoder.encode(payload + '\n'));
                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            }
            
            // Close the stream
            writer.close();
          } catch (error) {
            console.error("Error in stream processing:", error);
            
            // Send error to client
            const errorPayload = JSON.stringify({
              success: false,
              error: error.message
            });
            await writer.write(encoder.encode(errorPayload + '\n'));
            writer.close();
          }
        })();
      },
    });
    
    // Return the stream as the response
    return new Response(stream);
  } catch (error) {
    console.error("Error in POST handler:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
