import { google } from "googleapis";
import { ClientsMap, ValidationResult } from "../types";
import { getOauth2Client } from "@amurex/web/lib";

export const validateGoogleAccess = async (
  userId: string,
  refreshToken: string,
  clientsMap: ClientsMap,
): Promise<ValidationResult> => {
  try {
    // Get the client credentials from the map
    const userData = clientsMap[userId];
    if (!userData) {
      throw new Error("Client credentials not found for user");
    }

    // Create the OAuth client
    const oauth2Client = getOauth2Client({ userData });

    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Create Drive API client
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Make API calls that require the specific scopes we need:
    // 1. Try to list files (requires drive.readonly)
    await drive.files.list({
      pageSize: 1,
      fields: "files(id, name)",
    });

    // 2. Try to access docs (requires documents.readonly)
    const docs = google.docs({ version: "v1", auth: oauth2Client });

    // Get a list of docs first
    const filesList = await drive.files.list({
      pageSize: 1,
      q: "mimeType='application/vnd.google-apps.document'",
      fields: "files(id)",
    });

    // If we have at least one doc, try to access it
    if (filesList.data.files && filesList.data.files.length > 0) {
      const docId = filesList.data.files[0]?.id;
      if (docId) {
        await docs.documents.get({
          documentId: docId,
        });
      }
    }

    console.log("Token validated successfully for user:", userId);
    return { valid: true };
  } catch (error: unknown) {
    // Handle error typing
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any).code;
    const status = (error as any).status || (error as any).response?.status;

    if (
      status === 401 ||
      status === 403 ||
      errorMessage.includes("insufficient authentication") ||
      errorMessage.includes("invalid_grant") ||
      errorMessage.includes("invalid credentials") ||
      errorMessage.includes("insufficient permission") ||
      errorCode === "EAUTH"
    ) {
      return {
        valid: false,
        reason: "insufficient_permissions",
        message:
          "User needs to reconnect their Google account with drive.readonly and documents.readonly permissions",
      };
    }

    // For other types of errors
    return {
      valid: false,
      reason: "error",
      message: errorMessage || "Unknown error",
    };
  }
};
