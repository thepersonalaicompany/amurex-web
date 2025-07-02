export const dynamic = "force-dynamic";
import { GoogleCallbackContent } from "@amurex/ui/components";
import { Suspense } from "react";

export default function GoogleCallbackPage(): JSX.Element {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
