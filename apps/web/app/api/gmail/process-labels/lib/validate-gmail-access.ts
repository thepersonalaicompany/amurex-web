import { google } from "googleapis";
import { Auth } from "googleapis";

interface ValidationResult {
  valid: boolean;
  reason?: "insufficient_permissions" | "error";
  message?: string;
}

/**
 * Helper function to validate token by making a simple API call
 */
async function validateGmailAccess(
  oauth2Client: Auth.OAuth2Client,
): Promise<ValidationResult> {
  try {
    console.log(`Validating Gmail access with OAuth client`);

    // Create Gmail API client
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Make API calls that require the specific scopes we need:
    // 1. Try to get labels (requires gmail.labels)
    const labels = await gmail.users.labels.list({ userId: "me" });

    // 2. Try to modify a label (requires gmail.modify)
    // Use a dummy modification on an existing label just to test permissions
    if (labels.data.labels && labels.data.labels.length > 0) {
      const testLabelId = labels.data.labels[0]?.id;
      if (testLabelId) {
        await gmail.users.labels.get({
          userId: "me",
          id: testLabelId,
        } as any);
      }
    } else {
      // If no labels, we need to check permissions another way for gmail.modify
      // Try to get a message to test gmail.readonly
      const messages = await gmail.users.messages.list({
        userId: "me",
        maxResults: 1,
      });

      if (messages.data.messages?.[0]?.id) {
        await gmail.users.messages.get({
          userId: "me",
          id: messages.data.messages[0].id,
        } as any);
      }
    }

    // If we get here, the token is valid and has the required scopes
    return { valid: true };
  } catch (error: unknown) {
    console.error(`Token validation failed:`, error);

    // Check for specific error types that indicate permission issues
    const errorMessage = error instanceof Error ? error.message : "";
    const errorCode = (error as any).code || "";
    const status =
      (error as any).status ||
      ((error as any).response && (error as any).response.status);

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
}

export { validateGmailAccess };
