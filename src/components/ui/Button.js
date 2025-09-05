import React from "react";

export const Button = ({
  children,
  className,
  variant = "primary",
  size = "medium",
  ...props
}) => {
  const baseStyles =
    "font-bold rounded-lg focus:outline-none transition-colors";
  const variantStyles = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    ghost: "bg-transparent hover:bg-gray-100",
    navbar:
      "border border-transparent bg-transparent hover:border hover:bg-[#3c1671] hover:border-[#6D28D9]",
  };
  const sizeStyles = {
    small: "px-2 py-1 text-sm",
    medium: "px-4 py-2",
    large: "px-6 py-3 text-lg",
    icon: "p-2",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
