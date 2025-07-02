// Update storeEmailInDatabase function to include embeddings

import { supabaseAdminClient } from "@amurex/supabase";

/**
 * Stores an email in the database with optional embeddings
 * @returns Promise that resolves to true if a new email was inserted
 */
export const storeEmailInDatabase = async (
  userId: string,
  messageId: string,
  threadId: string,
  sender: string,
  subject: string,
  content: string | null,
  receivedAt: Date,
  isRead: boolean,
  snippet: string | null,
): Promise<boolean> => {
  // initialize supabase admin client with service role key
  const adminSupabase = supabaseAdminClient(
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  // Check if email already exists in the database
  const { data: existingEmail } = await adminSupabase
    .from("emails")
    .select("id")
    .eq("user_id", userId)
    .eq("message_id", messageId)
    .maybeSingle();

  if (!existingEmail) {
    // Generate embeddings for the email content or at least the subject
    // let embedding = null;
    // let textToEmbed = "";

    // if (content && content.trim() !== '') {
    //   // Combine subject and content for better semantic representation
    //   textToEmbed = `Subject: ${subject}\n\n${content}`;
    // } else if (subject && subject.trim() !== '') {
    //   // If no content, at least embed the subject
    //   textToEmbed = `Subject: ${subject}`;
    //   console.log(`No content for email ${messageId}, embedding subject only`);
    // } else if (snippet && snippet.trim() !== '') {
    //   // If no subject or content, try using the snippet
    //   textToEmbed = snippet;
    //   console.log(`No subject or content for email ${messageId}, embedding snippet only`);
    // }

    // // Only try to generate embeddings if we have some text
    // if (textToEmbed.trim() !== '') {
    //   embedding = await generateEmbeddings(textToEmbed);
    // }

    /**
     * @type {{
     *   user_id: string,
     *   message_id: string,
     *   thread_id: string,
     *   sender: string,
     *   subject: string,
     *   content: string | null,
     *   received_at: string,
     *   created_at: string,
     *   is_read: boolean,
     *   snippet: string | null
     * }}
     */
    const emailData = {
      user_id: userId,
      message_id: messageId,
      thread_id: threadId,
      sender: sender,
      subject: subject,
      content: content,
      received_at: receivedAt.toISOString(),
      created_at: new Date().toISOString(),
      is_read: isRead,
      snippet: snippet,
    };

    console.log(`Storing email in database:`, {
      message_id: messageId,
      thread_id: threadId,
      subject: subject,
      content_length: content ? content.length : 0,
      has_embedding: false,
    });

    const { error: insertError } = await adminSupabase
      .from("emails")
      .insert(emailData);

    if (insertError) {
      console.error("Error inserting email into database:", insertError);

      // Handle potential schema mismatch errors
      if (
        insertError.message &&
        (insertError.message.includes("category") ||
          insertError.message.includes("is_categorized"))
      ) {
        /** @type {Partial<typeof emailData & { category?: string; is_categorized?: boolean }>} */
        const simplifiedData = { ...emailData } as any;
        delete simplifiedData.category;
        delete simplifiedData.is_categorized;

        const { error: retryError } = await adminSupabase
          .from("emails")
          .insert(simplifiedData);

        if (retryError) {
          console.error(
            "Error inserting email with simplified fields:",
            retryError,
          );
        } else {
          console.log(
            `Email ${messageId} stored in database with simplified fields`,
          );
        }
      }
    } else {
      console.log(`Email ${messageId} stored in database successfully`);
    }
  }
  return !existingEmail;
};
