"use client";

import { Star } from "lucide-react";
import { Github } from "lucide-react";

export default function StarButton() {
  return (
    <button
      className="fixed right-4 top-4 flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-white transition-all duration-200"
      onClick={() =>
        window.open(
          "https://github.com/thepersonalaicompany/amurex-web",
          "_blank"
        )
      }
    >
      <Star
        className="fill-yellow-300 stroke-yellow-300 transition-all duration-300"
        size={18}
      />
      <span className="text-sm font-medium">Star Amurex on GitHub</span>
      <Github className="h-5 w-5" />
    </button>
  );
}
