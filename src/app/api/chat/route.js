// 1. Import Dependencies
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { BraveSearch } from "@langchain/community/tools/brave_search";
import OpenAI from "openai";
import { cheerio } from "cheerio";
import { createClient } from "@supabase/supabase-js";
// 2. Initialize OpenAI and Supabase clients
const openai = new OpenAI();
const embeddings = new OpenAIEmbeddings();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// 3. Send payload to Supabase table
async function sendPayload(content, user_id) {
  await supabase
    .from("message_history")
    .insert([{ 
      payload: content,
      user_id: user_id 
    }])
    .select("id");
}
// 4. Rephrase input using GPT
async function rephraseInput(inputString) {
  const gptAnswer = await openai.chat.completions.create({
    model: "gpt-4o-mini",
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

async function aiSearch(query, user_id) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;

  // Search in page_sections using the match_page_sections function
  const { data: sections, error: sectionsError } = await supabase
    .rpc('match_page_sections', {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.3,
      match_count: 5,
      user_id: user_id
    });

  if (sectionsError) throw sectionsError;

  // Get unique document IDs from the matching sections
  const documentIds = [...new Set(sections.map(section => section.document_id))];

  // Fetch the corresponding documents
  const { data: documents, error: documentsError } = await supabase
    .from('documents')
    .select('id, url, title, meta, tags, text')
    .in('id', documentIds)
    .eq('user_id', user_id);

  if (documentsError) throw documentsError;

  // Combine the results
  const results = documents.map(doc => ({
    id: doc.id,
    title: doc.title,
    url: doc.url,
    content: doc.text,
    tags: doc.tags,
    relevantSections: sections
      .filter(section => section.document_id === doc.id)
      .map(section => ({
        context: section.context,
        similarity: section.similarity
      }))
  }));

  return { results };
}

// 5. Search engine for sources
async function searchEngineForSources(message, internetSearchEnabled, user_id) {
  let combinedResults = [];

  // Perform Supabase document search
  const supabaseResults = await aiSearch(message, user_id);
  const supabaseData = supabaseResults.results.map(doc => ({
    title: doc.title,
    link: doc.url,
    text: doc.content,
    relevantSections: doc.relevantSections
  }));
  combinedResults = [...combinedResults, ...supabaseData];

  if (internetSearchEnabled) {
    const loader = new BraveSearch({ apiKey: process.env.BRAVE_SEARCH_API_KEY });
    const repahrasedMessage = await rephraseInput(message);
    const docs = await loader.call(repahrasedMessage);
    function normalizeData(docs) {
      return JSON.parse(docs)
        .filter((doc) => doc.title && doc.link && !doc.link.includes("brave.com"))
        .slice(0, 4)
        .map(({ title, link }) => ({ title, link }));
    }
    const normalizedData = normalizeData(docs);
    combinedResults = [...combinedResults, ...normalizedData];
  }

  await sendPayload({ type: "Sources", content: combinedResults }, user_id);

  let vectorCount = 0;
  const fetchAndProcess = async (item) => {
    try {
      let htmlContent;
      if (item.text) {
        // If the item has text (from Supabase), use it directly
        htmlContent = item.text;
      } else {
        // Otherwise, fetch the content from the URL
        const timer = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1500));
        const fetchPromise = fetchPageContent(item.link);
        htmlContent = await Promise.race([timer, fetchPromise]);
      }

      if (htmlContent.length < 250) return null;

      const splitText = await new RecursiveCharacterTextSplitter({ chunkSize: 200, chunkOverlap: 0 }).splitText(
        htmlContent
      );
      const vectorStore = await MemoryVectorStore.fromTexts(splitText, { annotationPosition: item.link }, embeddings);
      vectorCount++;
      return await vectorStore.similaritySearch(message, 1);
    } catch (error) {
      console.log(`Failed to process content for ${item.link}, skipping!`);
      vectorCount++;
      return null;
    }
  };

  const results = await Promise.all(combinedResults.map(fetchAndProcess));

  while (vectorCount < 4) {
    vectorCount++;
  }

  const successfulResults = results.filter((result) => result !== null);
  const topResult = successfulResults.length > 4 ? successfulResults.slice(0, 4) : successfulResults;

  await sendPayload({ type: "VectorCreation", content: `Finished Scanning Sources.` }, user_id);
  triggerLLMAndFollowup(`Query: ${message}, Top Results: ${JSON.stringify(topResult)}`, user_id);
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
      rowId = await updateRowWithGPTResponse(rowId, accumulatedContent, user_id);
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
    model: "gpt-4o-mini",
  });
// 53. Return the content of the chat completion
  return chatCompletion.choices[0].message.content;
}
// 54. Define POST function for API endpoint
export async function POST(req, res) {
  const { message, internetSearchEnabled, user_id } = await req.json();
  
  if (!user_id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sendPayload({ type: "Query", content: message }, user_id);
  await searchEngineForSources(message, internetSearchEnabled, user_id);

  return Response.json({ "message": "Processing request" });
}
