import { Client } from "@notionhq/client";
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const isParagraphBlock = (
  block: any,
): block is BlockObjectResponse & {
  type: "paragraph";
  paragraph: { rich_text: Array<{ plain_text: string }> };
} => {
  return block?.type === "paragraph" && block?.paragraph?.rich_text?.length > 0;
};

export const fetchNotionText = async (url: string): Promise<string> => {
  const pageId = url.split("-").pop();
  if (!pageId) {
    throw new Error("Invalid Notion URL: Could not extract page ID");
  }
  const response = await notion.blocks.children.list({ block_id: pageId });
  return response.results
    .filter(isParagraphBlock)
    .map((block) => block.paragraph.rich_text[0]?.plain_text ?? "")
    .join("\n");
};
