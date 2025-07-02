// TODO: remove any

import { extractBlockContent } from "./extractBlockContent";

export const fetchNotionPageContent = async (
  notion: any,
  pageId: string,
): Promise<string> => {
  const response = await notion.blocks.children.list({ block_id: pageId });
  let content: string[] = [];

  for (const block of response.results) {
    const blockContent = extractBlockContent(block);
    if (blockContent) {
      content.push(blockContent);
    }

    // Recursively fetch child blocks if they exist
    if (block.has_children) {
      const childContent = await fetchNotionPageContent(notion, block.id);
      if (childContent) {
        content.push(childContent);
      }
    }
  }

  return content.join("\n");
};
