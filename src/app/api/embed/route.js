import { NextResponse } from "next/server";
import PipelineSingleton from "./pipeline.js";

export async function GET(request) {
  const text = request.nextUrl.searchParams.get("text");
  if (!text) {
    return NextResponse.json(
      {
        error: "Missing text parameter",
      },
      { status: 400 }
    );
  }
  // Get the embedding pipeline. When called for the first time,
  // this will load the pipeline and cache it for future use.
  const embeddings = await PipelineSingleton.getInstance();

  // Actually perform the embeddings
  const result = await embeddings(text, {
    pooling: "mean",
    normalize: true,
  });

  let response = {
    object: "transform.js",
    index: 0,
    embedding: Array.from(result.data),
  };
  console.log(result.data);

  return NextResponse.json({ data: response });
}
