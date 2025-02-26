
import { useEffect, useState } from 'react';

export default function FollowingEyes() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Calculate eye movement (limit to 30% movement from center)
    const eyeCenter = { x: window.innerWidth - 100, y: window.innerHeight / 2 };
    const angle = Math.atan2(mousePosition.y - eyeCenter.y, mousePosition.x - eyeCenter.x);
    const distance = 5; // Maximum pixel movement
    
    setEyePosition({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    });
  }, [mousePosition]);

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50">
      <div className="relative w-[60px] h-[80px] bg-white rounded-full flex items-center justify-center shadow-lg">
        <div 
          className="w-8 h-8 bg-black rounded-full absolute"
          style={{ 
            transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className="w-2 h-2 bg-white rounded-full absolute top-1 left-1" />
        </div>
      </div>
    </div>
  );
}
