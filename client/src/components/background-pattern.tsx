import React from "react";

export function BackgroundPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Funky background patterns as in the original design */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#0004_1px,transparent_1px),linear-gradient(to_bottom,#0004_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      {/* Circle background elements */}
      <div className="absolute -top-[300px] -left-[300px] w-[600px] h-[600px] rounded-full border-[50px] border-gray-100/10 circle-animation"></div>
      <div className="absolute top-[30%] -right-[200px] w-[400px] h-[400px] rounded-full border-[40px] border-gray-100/5 circle-animation animation-delay-1000"></div>
      <div className="absolute -bottom-[250px] left-[10%] w-[500px] h-[500px] rounded-full border-[30px] border-gray-100/10 circle-animation animation-delay-2000"></div>
      
      {/* Grid background */}
      <svg 
        className="absolute top-0 left-0 w-full h-full opacity-[0.03]" 
        width="100%" 
        height="100%" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="gray" strokeWidth="0.5" />
          </pattern>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#smallGrid)" />
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="gray" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      {/* Decorative lines */}
      <svg 
        className="absolute top-0 right-0 h-screen w-1/2 opacity-10" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        <path 
          d="M0,0 L100,100" 
          stroke="#367BF5" 
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
          className="animate-draw"
        />
        <path 
          d="M100,0 L0,100" 
          stroke="#367BF5" 
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
          className="animate-draw animation-delay-1000"
        />
      </svg>
    </div>
  );
}