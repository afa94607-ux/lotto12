import React from 'react';

interface GoldenBowlProps {
  className?: string;
  isLarge?: boolean;
  style?: React.CSSProperties;
}

export const GoldenBowl: React.FC<GoldenBowlProps> = ({ className = '', isLarge = false, style }) => {
  return (
    <div
      style={style}
      className={`relative rounded-xl border-2 border-[#1e40af] bg-gradient-to-b from-[#eef2f9] to-[#dbe4f3] p-1 flex items-center justify-center shadow-md overflow-hidden ${
        isLarge ? 'w-32 h-32 sm:w-36 sm:h-36' : 'w-14 h-14 sm:w-16 sm:h-16'
      } ${className}`}
    >
      {/* Blue Circular Badge with Radial Glow */}
      <div className="w-[90%] h-[90%] rounded-full bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#0284c7] p-1 flex items-center justify-center shadow-inner relative border-2 border-[#3b82f6]">
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(96,165,250,0.6)_0%,_transparent_70%)] pointer-events-none" />

        <span
          className={`font-black font-sans text-amber-300 drop-shadow-md select-none z-10 ${
            isLarge ? 'text-4xl sm:text-5xl' : 'text-xl sm:text-2xl'
          }`}
        >
          ?
        </span>
      </div>
    </div>
  );
};
