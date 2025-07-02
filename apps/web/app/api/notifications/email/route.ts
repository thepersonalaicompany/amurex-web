import { ResendClient as resend } from "@amurex/web/lib";
import {
  ImportCompleteEmailGoogle,
  ImportCompleteEmailNotion,
  ImportCompleteEmailObsidian,
} from "./lib";

export async function POST(request: Request) {
  try {
    const { userEmail, importResults, platform } = await request.json();

    console.log("importResulst", importResults);

    // Validate inputs
    if (!userEmail || !importResults || !Array.isArray(importResults)) {
      console.error("Invalid request data:", { userEmail, importResults });

      return Response.json(
        {
          error:
            "Invalid request data. Expected userEmail and importResults array.",
        },
        { status: 400 },
      );
    }

    if (platform === "notion") {
      const { data, error } = await resend.emails.send({
        from: "Amurex <founders@thepersonalaicompany.com>",
        to: userEmail,
        subject: "Notion Import Complete",
        react: ImportCompleteEmailNotion({ documents: importResults }),
      });

      if (error) {
        console.error("Resend API error:", error);
        return Response.json({ error }, { status: 500 });
      }

      return Response.json(data);
    } else if (platform === "obsidian") {
      const { data, error } = await resend.emails.send({
        from: "Amurex <founders@thepersonalaicompany.com>",
        to: userEmail,
        subject: "Obsidian Import Complete",
        react: ImportCompleteEmailObsidian({ documents: importResults }),
      });

      if (error) {
        console.error("Resend API error:", error);
        return Response.json({ error }, { status: 500 });
      }

      return Response.json(data);
    } else {
      const { data, error } = await resend.emails.send({
        from: "Amurex <founders@thepersonalaicompany.com>",
        to: userEmail,
        subject: "Google Docs Import Complete",
        react: ImportCompleteEmailGoogle({ documents: importResults }),
      });

      if (error) {
        console.error("Resend API error:", error);
        return Response.json({ error }, { status: 500 });
      }

      return Response.json(data);
    }
  } catch (error) {
    console.error("Error sending email notification:", error);
    return Response.json({ error }, { status: 500 });
  }
}
