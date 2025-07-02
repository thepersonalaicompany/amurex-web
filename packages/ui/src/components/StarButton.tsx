"use client";

import { Star } from "lucide-react";
import { Github } from "lucide-react";

export const StarButton = () => {
  return (
    <button
      className="border border-zinc-800 fixed top-4 right-4 flex items-center gap-2 px-3 py-2.5 rounded-md transition-all duration-200 bg-zinc-900/70 text-white"
      onClick={() =>
        window.open(
          "https://github.com/thepersonalaicompany/amurex-web",
          "_blank",
        )
      }
    >
      <Star
        className="transition-all duration-300 fill-yellow-300 stroke-yellow-300"
        size={18}
      />
      <span className="font-medium text-sm">Star Amurex on GitHub</span>
      <Github className="w-5 h-5" />
    </button>
  );
};
