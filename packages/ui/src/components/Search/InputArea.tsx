import { useSearchStore } from "@amurex/ui/store";
import { useEffect, useRef } from "react";
import { ArrowCircleRight } from "@phosphor-icons/react";

type InputWithFocus = HTMLInputElement & { focusInput?: () => void };

export function InputArea({
  className = "",
  placeholder = "Search your knowledge...",
}: {
  className?: string;
  placeholder?: string;
}) {
  const { inputValue, setInputValue, sendMessage } = useSearchStore();
  const inputRef = useRef<InputWithFocus>(null);

  // Expose the focus method to parent components
  useEffect(() => {
    // Add focus method to the DOM element for external access
    if (inputRef.current) {
      inputRef.current.focusInput = () => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };
    }
  }, []);

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative flex-1 flex items-center">
        <div className="absolute left-3 md:left-4 text-zinc-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="flex-1 p-3 md:p-4 pl-10 md:pl-12 text-md rounded-l-lg focus:outline-none bg-black border border-zinc-800 text-zinc-300 focus:border-[#6D28D9] transition-colors"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(inputValue, false)}
        />
      </div>
      <button
        onClick={() => sendMessage(inputValue, false)}
        className="p-3 md:p-4 rounded-r-lg bg-black border-t border-r border-b border-zinc-800 text-zinc-300 hover:bg-[#3c1671] transition-colors"
      >
        <ArrowCircleRight size={20} className="md:w-6 md:h-6" />
      </button>
    </div>
  );
}
InputArea.displayName = "InputArea";
