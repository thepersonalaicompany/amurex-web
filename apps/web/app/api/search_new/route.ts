import { NextResponse } from "next/server";
import { SearchRequest } from "./types";
import { aiSearch, patternSearch } from "./lib";

export async function POST(req: Request): Promise<NextResponse> {
  const { query, searchType, session }: SearchRequest = await req.json();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (searchType === "ai") {
      const result = await aiSearch(query, session.user.id);
      return result;
    } else if (searchType === "pattern") {
      return await patternSearch(query, session.user.id);
    } else {
      return NextResponse.json(
        { error: "Invalid search type" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error during search:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
