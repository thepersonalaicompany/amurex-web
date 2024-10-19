import React from 'react';

export const PinTile = ({ pin, onClick }) => {
  return (
    <div
      className={`mb-4 break-inside-avoid cursor-pointer ${
        pin.size === "large"
          ? "h-[500px]"
          : pin.size === "medium"
          ? "h-[400px]"
          : "h-[300px]"
      }`}
      onClick={() => onClick(pin)}
    >
      <div className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out h-full flex flex-col" style={{ backgroundColor: "var(--surface-color)" }}>
        <div className="relative flex-grow">
          <img
            src={pin.image}
            alt={pin.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
            <div className="flex flex-wrap justify-center">
              {pin.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="text-xs px-2 py-1 rounded-full m-1" style={{ backgroundColor: "var(--later-tag-background)", color: "var(--later-tag-color)" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {pin.type === "notion" && (
            <div className="absolute top-2 left-2 bg-white rounded-full p-1">
              <img
                src="/notion-icon.png"
                alt="Notion"
                className="w-6 h-6"
              />
            </div>
          )}
          {pin.type === "google" && (
            <div className="absolute top-2 right-2 bg-white rounded-full p-1">
              <img
                src="https://www.google.com/images/about/docs-icon.svg"
                alt="Google Docs"
                className="w-6 h-6"
              />
            </div>
          )}
        </div>
        <h3
          className="text-center font-semibold px-2 py-2 font-serif text-sm italic"
          style={{ fontFamily: "'Playfair Display', serif", color: "var(--color)" }}
        >
          {pin.title}
        </h3>
      </div>
    </div>
  );
};
