import React, { useState } from 'react';
import { PinPopover } from './PinPopover';
import { motion } from 'framer-motion';
import { FileText, FileType2 } from 'lucide-react';

export const PinTile = ({ pin }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleClick = () => {
    if (pin.type === "notion" || pin.type === "google" || pin.type === "google_docs") {
      // Open external URLs in a new tab
      window.open(pin.url, '_blank');
    } else {
      // Open internal documents in the modal
      setIsPopoverOpen(true);
    }
  };

  const handleClose = () => {
    setIsPopoverOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-4 break-inside-avoid"
    >
      <div
        className="h-[300px] cursor-pointer"
        onClick={handleClick}
      >
        <div className="h-full">
          <div 
            className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out h-full flex flex-col"
            style={{ backgroundColor: "var(--surface-color)" }}
          >
            <div className="relative flex-grow p-4">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                {pin.type === "notion" && (
                  <FileText className="w-16 h-16 text-blue-600" />
                )}
                {(pin.type === "google" || pin.type === "google_docs") && (
                  <FileType2 className="w-16 h-16 text-green-600" />
                )}
                {pin.type !== "notion" && pin.type !== "google" && pin.type !== "google_docs" && (
                  <div className="text-2xl font-bold text-gray-600">Document</div>
                )}
              </div>
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              {pin.type === "notion" && (
                <div className="absolute top-2 left-2 bg-blue-100 rounded-full px-2 py-1 text-xs font-semibold text-blue-600">
                  Notion
                </div>
              )}
              {( pin.type === "google" || pin.type === "google_docs" ) && (
                <div className="absolute top-2 right-2 bg-green-100 rounded-full px-2 py-1 text-xs font-semibold text-green-600">
                  Google
                </div>
              )}
            </div>
          </div>
          <h3
            className="text-center font-semibold px-2 py-2 text-sm italic"
            style={{ fontFamily: "var(--font-louize), serif", color: "var(--color)" }}
          >
            {pin.title}
          </h3>
        </div>
      </div>
      {isPopoverOpen && <PinPopover pin={pin} onClose={handleClose} />}
    </motion.div>
  );
};
