import { groqClient as groq } from "@amurex/web/lib";

/**
 * Helper function to categorize emails using Groq
 * @param fromEmail - The sender's email address
 * @param subject - The email subject
 * @param body - The email body content
 * @param enabledCategories - Object containing category configuration with boolean values
 * @returns The matched category as a string, or empty string if no match or error
 */
export const categorizeWithAI = async (
  fromEmail: string,
  subject: string,
  body: string,
  enabledCategories: Record<string, boolean>,
): Promise<string> => {
  try {
    // build the system prompt based on enabled categories
    let systemPrompt =
      "You are an email classifier. Classify the email into one of these categories (but don't come up with any other new categories):\n";
    let categoryMap: Record<number, string> = {};
    let index = 1;

    // Track if we have any enabled categories
    let hasEnabledCategories = false;

    // Add enabled categories to the prompt and mapping
    for (const [category, enabled] of Object.entries(enabledCategories)) {
      if (enabled) {
        hasEnabledCategories = true;
        const formattedCategory = category.replace(/_/g, " "); // Convert to_respond to "to respond"
        systemPrompt += `${index} = ${formattedCategory}\n`;
        categoryMap[index] = formattedCategory;
        index++;
      }
    }

    // If no categories are enabled, return empty string to indicate no categorization
    if (!hasEnabledCategories) {
      console.log(
        "No categories enabled for this user, skipping categorization",
      );
      return "";
    }

    systemPrompt += `\nRespond ONLY with the number (1-${index - 1}). If the email doesn't fit into any of these categories, respond with 0. Do not include any other text, just the single digit number.`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Email from: ${fromEmail}\nSubject: ${subject}\n\nBody: ${body}`,
        },
      ],
      max_tokens: 20,
      temperature: 0.3,
    });

    // Get the raw response and convert to a number
    const rawResponse = response.choices?.[0]?.message?.content?.trim() || "";

    // Extract just the first digit from the response
    const numberMatch = rawResponse.match(/\d+/);
    const categoryNumber = numberMatch ? parseInt(numberMatch[0]) : null;

    // Look up the category by number (0 means no category fits)
    if (categoryNumber && categoryNumber > 0 && categoryMap[categoryNumber]) {
      const category = categoryMap[categoryNumber];
      return category;
    } else {
      // Return empty string if no category fits or if the number is invalid
      console.log(
        `No matching category (${categoryNumber}), skipping categorization`,
      );
      return "";
    }
  } catch (error) {
    console.error(`Error categorizing with Groq:`, error);
    // Return empty string on error to indicate no categorization
    return "";
  }
};
