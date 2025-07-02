interface GoogleDoc {
  title: string;
  id?: string;
  url?: string;
}

export const ImportCompleteEmailGoogle = ({
  documents,
}: {
  documents: GoogleDoc[];
}) => {
  return (
    <div>
      <h2>Your Google Docs Import is Complete!</h2>
      <p>We&apos;ve successfully imported the following documents:</p>
      <ul>
        {documents.map((doc, index) => (
          <li key={index}>{doc.title}</li>
        ))}
      </ul>
      <p>
        You can now access these documents in your Amurex workspace at{" "}
        <a href="https://app.amurex.ai/search">app.amurex.ai/search</a>
      </p>
    </div>
  );
};
