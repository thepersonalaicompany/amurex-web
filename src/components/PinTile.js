import React, { useState } from 'react';
import { PinPopover } from './PinPopover';

export const PinTile = ({ pin }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleClick = () => {
    setIsPopoverOpen(true);
  };

  const handleClose = () => {
    setIsPopoverOpen(false);
  };

  return (
    <>
      <div
        className={`mb-4 break-inside-avoid`}
        onClick={handleClick}
      >
        <div className="h-full">
          <div className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out h-full flex flex-col" style={{ backgroundColor: "var(--surface-color)" }}>
            <div className="relative flex-grow">
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                {pin.type === "notion" && (
                  <div className="text-2xl font-bold text-blue-600">Notion</div>
                )}
                {pin.type === "google" && (
                  <div className="text-2xl font-bold text-green-600">Google</div>
                )}
                {pin.type !== "notion" && pin.type !== "google" && (
                  <div className="text-2xl font-bold text-gray-600">Document</div>
                )}
              </div>
              <div className="absolute inset-0 group-hover:bg-black group-hover:bg-opacity-30 transition-opacity duration-300"></div>
              {pin.type === "notion" && (
                <div className="absolute top-2 left-2 bg-white rounded-full px-2 py-1 text-xs font-semibold text-blue-600">
                  Notion
                </div>
              )}
              {pin.type === "google" && (
                <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-xs font-semibold text-green-600">
                  Google
                </div>
              )}
            </div>
          </div>
          <h3
            className="text-center font-semibold px-2 py-2 font-serif text-sm italic"
            style={{ fontFamily: "'Playfair Display', serif", color: "var(--color)" }}
          >
            {pin.title}
          </h3>
        </div>
      </div>
      {isPopoverOpen && <PinPopover pin={pin} onClose={handleClose} />}
    </>
  );
};
