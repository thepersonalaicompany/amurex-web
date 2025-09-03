import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabaseClient";

export async function GET(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const accessToken = authHeader.split(" ")[1];
  const supabase = createSupabaseClient(accessToken);

  try {
    const { data, error } = await supabase.from("documents").select("*");

    if (error) throw error;

    return NextResponse.json({ success: true, documents: data });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
