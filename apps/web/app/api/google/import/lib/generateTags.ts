import { groqClient as groq } from "@amurex/web/lib";

export const generateTags = async (text: string): Promise<string[]> => {
  const tagsResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that generates relevant tags for a given text. Provide the tags as a comma-separated list without numbers or bullet points.",
      },
      {
        role: "user",
        content: `Generate 3 relevant tags for the following text, separated by commas:\n\n${text.substring(
          0,
          1000,
        )}`,
      },
    ],
  });

  // TODO?: added null check
  return (
    tagsResponse.choices[0]?.message?.content
      ?.split(",")
      ?.map((tag) => tag.trim()) ?? []
  );
};
