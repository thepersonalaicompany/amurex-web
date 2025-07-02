import { EmailsContent } from "@amurex/web/components/EmailsContent";
import { Suspense } from "react";

const EmailsPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailsContent />
    </Suspense>
  );
};

export default EmailsPage;
