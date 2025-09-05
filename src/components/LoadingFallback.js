import React from "react";

const LoadingFallback = () => {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
    </div>
  );
};

export default LoadingFallback;
