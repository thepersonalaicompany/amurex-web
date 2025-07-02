interface IconToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  color?: string;
}

export const IconToggle: React.FC<IconToggleProps> = ({
  checked,
  onChange,
  className,
  color = "#9334E9",
}) => {
  return (
    <div
      className={`relative w-14 h-8 flex items-center cursor-pointer ${className}`}
      onClick={() => onChange(!checked)}
    >
      {/* Background track */}
      <div
        className={`absolute w-full h-full rounded-full transition-all duration-300 ${checked ? "bg-black border-2" : "bg-zinc-900 border-2 border-zinc-700"}`}
        style={{ borderColor: checked ? color : "" }}
      ></div>

      {/* Slider thumb */}
      <div
        className={`absolute w-6 h-6 rounded-full shadow-md transform transition-all duration-300
        ${checked ? "translate-x-7" : "translate-x-1"}`}
        style={{ backgroundColor: checked ? color : "#3f3f46" }}
      >
        <span
          className={`absolute inset-0 rounded-full flex items-center justify-center`}
          style={{ backgroundColor: checked ? color : "#3f3f46" }}
        >
          {checked ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
      </div>
    </div>
  );
};
