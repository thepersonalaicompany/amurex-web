import React, { InputHTMLAttributes } from "react";

export const Input = ({ className, type, ...props }) => {
  return (
    <input
      type={type}
      className={`w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none ${className}`}
      {...props}
    />
  );
};
