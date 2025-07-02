import { supabase } from "@amurex/supabase";
import { Email, EmailData, ProcessResult } from "../types";

export async function processEmails(
  emails: Email[],
  userId: string,
  labelId: string,
  labelName: string,
  labelColor: string,
): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];

  // First, get all existing message IDs for this user to avoid duplicates
  const { data: existingEmails, error: fetchError } = await supabase
    .from("emails")
    .select("message_id")
    .eq("user_id", userId);

  if (fetchError) {
    console.error("Error fetching existing emails:", fetchError);
    return [];
  }

  // Create a Set of existing message IDs for faster lookup
  const existingMessageIds = new Set<string>();
  if (existingEmails && existingEmails.length > 0) {
    existingEmails.forEach((email) => existingMessageIds.add(email.message_id));
  }

  console.log(
    `Found ${existingMessageIds.size} existing emails for user ${userId}`,
  );

  for (const email of emails) {
    try {
      // Skip if email already exists in database
      if (existingMessageIds.has(email.id)) {
        console.log(`Skipping email ${email.id} - already in database`);
        results.push({
          id: email.id,
          status: "skipped",
          reason: "already_exists",
        });
        continue;
      }

      // Check if email already has an Amurex label
      const hasAmurexLabel =
        email.labelIds?.some(
          (label) => label.startsWith("Label_") && label.includes("Amurex"),
        ) ?? false;

      if (hasAmurexLabel) {
        console.log(`Skipping email ${email.id} - already has Amurex label`);
        results.push({
          id: email.id,
          status: "skipped",
          reason: "already_labeled",
        });
        continue;
      }

      // Extract email content
      let content = "";
      const payload = email.payload;

      // Check for plain text content
      if (payload.body?.data) {
        content = Buffer.from(payload.body.data, "base64").toString("utf-8");
      }
      // Check for multipart content
      else if (payload.parts) {
        // Try to find HTML or plain text parts
        for (const part of payload.parts) {
          if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
            if (part.body?.data) {
              const partContent = Buffer.from(
                part.body.data,
                "base64",
              ).toString("utf-8");
              content += partContent;
            }
          }
        }
      }

      // Get email headers
      const headers = payload.headers || [];
      const subject =
        headers.find((h) => h.name === "Subject")?.value || "No Subject";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const to = headers.find((h) => h.name === "To")?.value || "";
      const date = headers.find((h) => h.name === "Date")?.value || "";

      console.log(
        `Processing email: ${subject} (Content length: ${content.length})`,
      );

      // Store email in database
      const emailData: EmailData = {
        message_id: email.id,
        thread_id: email.threadId,
        user_id: userId,
        label_id: labelId,
        label_name: labelName,
        label_color: labelColor,
        subject,
        from,
        to,
        date,
        content,
        content_length: content.length,
        processed_at: new Date().toISOString(),
      };

      // Insert into database
      const { error } = await supabase.from("emails").insert(emailData);

      if (error) {
        console.error("Error storing email:", error);
        results.push({ id: email.id, status: "error", error: error.message });
      } else {
        results.push({ id: email.id, status: "success" });
      }
    } catch (error: any) {
      console.error(`Error processing email ${email.id}:`, error);
      results.push({
        id: email.id,
        status: "error",
        error: error.message || "Unknown error occurred",
      });
    }
  }

  return results;
}
