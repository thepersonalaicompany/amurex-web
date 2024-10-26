// 1. Import Dependencies
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { BraveSearch } from "@langchain/community/tools/brave_search";
import OpenAI from "openai";
import cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
// 2. Initialize OpenAI and Supabase clients
const openai = new OpenAI();
const embeddings = new OpenAIEmbeddings();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// 3. Send payload to Supabase table
async function sendPayload(content) {
  await supabase
    .from("message_history")
    .insert([{ payload: content }])
    .select("id");
}
// 4. Rephrase input using GPT
async function rephraseInput(inputString) {
  const gptAnswer = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
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
// 5. Search engine for sources
async function searchEngineForSources(message) {
  const loader = new BraveSearch({ apiKey: process.env.BRAVE_SEARCH_API_KEY });
  const repahrasedMessage = await rephraseInput(message);
  const docs = await loader.call(repahrasedMessage);
// 6. Normalize data
  function normalizeData(docs) {
    return JSON.parse(docs)
      .filter((doc) => doc.title && doc.link && !doc.link.includes("brave.com"))
      .slice(0, 4)
      .map(({ title, link }) => ({ title, link }));
  }
  const normalizedData = normalizeData(docs);
// 7. Send normalized data as payload
  sendPayload({ type: "Sources", content: normalizedData });
// 8. Initialize vectorCount
  let vectorCount = 0;
// 9. Initialize async function for processing each search result item
  const fetchAndProcess = async (item) => {
    try {
// 10. Create a timer for the fetch promise
      const timer = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1500));
// 11. Fetch the content of the page
      const fetchPromise = fetchPageContent(item.link);
// 12. Wait for either the fetch promise or the timer
      const htmlContent = await Promise.race([timer, fetchPromise]);
// 13. Check for insufficient content length
      if (htmlContent.length < 250) return null;
// 14. Split the text into chunks
      const splitText = await new RecursiveCharacterTextSplitter({ chunkSize: 200, chunkOverlap: 0 }).splitText(
        htmlContent
      );
// 15. Create a vector store from the split text
      const vectorStore = await MemoryVectorStore.fromTexts(splitText, { annotationPosition: item.link }, embeddings);
// 16. Increment the vector count
      vectorCount++;
// 17. Perform similarity search on the vectors
      return await vectorStore.similaritySearch(message, 1);
    } catch (error) {
// 18. Log any error and increment the vector count
      console.log(`Failed to fetch content for ${item.link}, skipping!`);
      vectorCount++;
      return null;
    }
  };
// 19. Wait for all fetch and process promises to complete
  const results = await Promise.all(normalizedData.map(fetchAndProcess));
// 20. Make sure that vectorCount reaches at least 4
  while (vectorCount < 4) {
    vectorCount++;
  }
// 21. Filter out unsuccessful results
  const successfulResults = results.filter((result) => result !== null);
// 22. Get top 4 results if there are more than 4, otherwise get all
  const topResult = successfulResults.length > 4 ? successfulResults.slice(0, 4) : successfulResults;
// 23. Send a payload message indicating the vector creation process is complete
  sendPayload({ type: "VectorCreation", content: `Finished Scanning Sources.` });
// 24. Trigger any remaining logic and follow-up actions
  triggerLLMAndFollowup(`Query: ${message}, Top Results: ${JSON.stringify(topResult)}`);
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
async function triggerLLMAndFollowup(inputString) {
// 28. Call getGPTResults with inputString
  await getGPTResults(inputString);
// 29. Generate follow-up with generateFollowup
  const followUpResult = await generateFollowup(inputString);
// 30. Send follow-up payload
  sendPayload({ type: "FollowUp", content: followUpResult });
// 31. Return JSON response
  return Response.json({ message: "Processing request" });
}
// 32. Define getGPTResults function
const getGPTResults = async (inputString) => {
// 33. Initialize accumulatedContent
  let accumulatedContent = "";
// 34. Open a streaming connection with OpenAI
  const stream = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
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
// 35. Create an initial row in the database
  let rowId = await createRowForGPTResponse();
// 36. Send initial payload
  sendPayload({ type: "Heading", content: "Answer" });
// 37. Iterate through the response stream
  for await (const part of stream) {
// 38. Check if delta content exists
    if (part.choices[0]?.delta?.content) {
// 39. Accumulate the content
      accumulatedContent += part.choices[0]?.delta?.content;
// 40. Update the row with new content
      rowId = await updateRowWithGPTResponse(rowId, accumulatedContent);
    }
  }
};
// 41. Define createRowForGPTResponse function
const createRowForGPTResponse = async () => {
// 42. Generate a unique stream ID
  const generateUniqueStreamId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  const streamId = generateUniqueStreamId();
// 43. Create the payload
  const payload = { type: "GPT", content: "" };
// 44. Insert into database
  const { data, error } = await supabase.from("message_history").insert([{ payload }]).select("id");
// 45. Return the ID and stream ID
  return { id: data ? data[0].id : null, streamId };
};
// 46. Define updateRowWithGPTResponse function
const updateRowWithGPTResponse = async (prevRowId, content) => {
// 47. Create the payload
  const payload = { type: "GPT", content };
// 48. Delete the previous row
  await supabase.from("message_history").delete().eq("id", prevRowId);
// 49. Insert updated data
  const { data } = await supabase.from("message_history").insert([{ payload }]).select("id");
// 50. Return the new row ID
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
    model: "gpt-4",
  });
// 53. Return the content of the chat completion
  return chatCompletion.choices[0].message.content;
}
// 54. Define POST function for API endpoint
export async function POST(req, res) {
// 55. Get message from request payload
  const { message } = await req.json();
// 56. Send query payload
  sendPayload({ type: "Query", content: message });
// 57. Start the search engine to find sources based on the query
  await searchEngineForSources(message);

  return Response.json({ "message": "Processing request" });
}
