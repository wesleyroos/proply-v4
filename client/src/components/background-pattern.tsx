import React from "react";

export function BackgroundPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Very subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#0004_1px,transparent_1px),linear-gradient(to_bottom,#0004_1px,transparent_1px)] bg-[size:40px_40px]"></div>
    </div>
  );
}