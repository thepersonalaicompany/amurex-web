import React, { InputHTMLAttributes } from "react";

export const Input = ({ className, ...props }) => {
  return (
    <input
      className={`w-full rounded-lg border px-3 py-2 text-gray-700 focus:outline-none ${className}`}
      {...props}
    />
  );
};
