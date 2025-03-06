import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const ImportCompleteEmailGoogle = ({ documents }) => {
  return (
    <div>
      <h2>Your Google Docs Import is Complete!</h2>
      <p>We&apos;ve successfully imported the following documents:</p>
      <ul>
        {documents.map((doc, index) => (
          <li key={index}>{doc.title}</li>
        ))}
      </ul>
      <p>You can now access these documents in your Amurex workspace.</p>
    </div>
  );
};

export const ImportCompleteEmailNotion = ({ documents }) => {
  return (
    <div>
      <h2>Your Notion Import is Complete!</h2>
      <p>We&apos;ve successfully imported the following documents:</p>
      <ul>
        {documents.map((doc, index) => (
          <li key={index}>{doc.title}</li>
        ))}
      </ul>
      <p>You can now access these documents in your Amurex workspace.</p>
    </div>
  );
};

export const ImportCompleteEmailObsidian = ({ documents }) => {
  return (
    <div>
      <h2>Your Obsidian Import is Complete!</h2>
      <p>We&apos;ve successfully imported the following documents:</p>
      <ul>
        {documents.map((doc, index) => (
          <li key={index}>{doc.title}</li>
        ))}
      </ul>
      <p>You can now access these documents in your Amurex workspace.</p>
    </div>
  );
};

export async function POST(request) {
  try {
    const { userEmail, importResults, platform } = await request.json();

    console.log("importResults", importResults);

    // Validate inputs
    if (!userEmail || !importResults || !Array.isArray(importResults)) {
      console.error("Invalid request data:", { userEmail, importResults });
      return Response.json(
        {
          error:
            "Invalid request data. Expected userEmail and importResults array.",
        },
        { status: 400 }
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
