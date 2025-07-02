"use client";

import { useEffect } from "react";

export const MeetLoader = () => {
  useEffect(() => {
    // Dynamically import ldrs only on the client side
    import("ldrs").then(({ ring }) => {
      ring.register();
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#09090B]">
      <div className="p-6 mx-auto">
        <div className="flex items-center justify-center h-screen">
          <l-ring
            size="55"
            stroke="5"
            bg-opacity="0"
            speed="2"
            color="white"
          ></l-ring>
        </div>
      </div>
    </div>
  );
};
