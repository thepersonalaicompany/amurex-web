import { fetchGoogleDocsText } from "./fetchGoogleDocsText";
import { fetchNotionText } from "./fetchNotionText";

export const fetchDocuemtText = async (url: string) => {
  if (url.includes("notion.so")) {
    return await fetchNotionText(url);
  } else if (url.includes("docs.google.com")) {
    return await fetchGoogleDocsText(url);
  } else {
    throw new Error("Unsupported document type");
  }
};
