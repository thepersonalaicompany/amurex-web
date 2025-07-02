import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ["https://www.googleapis.com/auth/documents.readonly"],
});

export const fetchGoogleDocsText = async (url: string): Promise<string> => {
  const docs = google.docs({ version: "v1", auth });

  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error("Invalid Google Docs URL");
  const docId = match[1];

  const response = await docs.documents.get({ documentId: docId });

  return (
    response.data.body?.content
      ?.filter((element) => element.paragraph)
      .map((element) =>
        element.paragraph?.elements?.map((e) => e.textRun?.content).join(""),
      )
      .join("") || ""
  );
};
