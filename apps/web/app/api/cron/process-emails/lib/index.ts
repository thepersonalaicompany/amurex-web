import { getOauth2Client } from "@amurex/web/lib";
import { google } from "googleapis";
import { ClientsMap, ValidationResult } from "../types";

/**
 * Helper function to validate token by making a simple API call
 */
export const validateGmailAccess = async (
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

    // Create the OAuth client using the cached client data
    const oauth2Client = getOauth2Client({ userData });

    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Create Gmail API client
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Make API calls that require the specific scopes we need:
    // 1. Try to get labels (requires gmail.labels)
    const labels = await gmail.users.labels.list({ userId: "me" });

    // 2. Try to modify a label (requires gmail.modify)
    // Use a dummy modification on an existing label just to test permissions
    if (labels.data.labels && labels.data.labels.length > 0) {
      const testLabelId = labels.data.labels[0]?.id;
      // We're not actually changing anything, just checking permissions
      if (testLabelId) {
        await gmail.users.labels.get({
          userId: "me",
          id: testLabelId,
        });
      }
    } else {
      // If no labels, we need to check permissions another way for gmail.modify
      // Try to get a message to test gmail.readonly
      const messages = await gmail.users.messages.list({
        userId: "me",
        maxResults: 1,
      });

      if (
        messages.data.messages &&
        messages.data.messages.length > 0 &&
        messages.data.messages[0]?.id
      ) {
        // Try to get a message (requires gmail.readonly)
        await gmail.users.messages.get({
          userId: "me",
          id: messages.data.messages[0]?.id,
        });
      }
    }

    // If we get here, the token is valid and has the required scopes
    return { valid: true };
  } catch (error: any) {
    // TODO: we can use gaxioserror to add types
    // Check for specific error types that indicate permission issues
    const errorMessage = error.message || "";
    const errorCode = error.code || "";
    const status = error.status || (error.response && error.response.status);

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
          "User needs to reconnect their Google account with gmail.readonly, gmail.modify, and gmail.labels permissions",
      };
    }

    // For other types of errors (network, etc.), we'll still return invalid but with a different reason
    return {
      valid: false,
      reason: "error",
      message: errorMessage || "Unknown error",
    };
  }
};
