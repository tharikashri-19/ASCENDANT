import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';

interface NeonSpinningBadgeProps {
  className?: string;
  onClick?: () => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function NeonSpinningBadge({ className = '', onClick, size = 'sm' }: NeonSpinningBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const containerSizes = {
    xs: 'w-18 h-18 sm:w-20 sm:h-20',
    sm: 'w-24 h-24 sm:w-28 sm:h-28',
    md: 'w-32 h-32 sm:w-36 sm:h-36',
    lg: 'w-36 h-36 sm:w-44 sm:h-44'
  };

  const medallionSizes = {
    xs: 'w-10 h-10 sm:w-11 sm:h-11',
    sm: 'w-14 h-14 sm:w-16 sm:h-16',
    md: 'w-18 h-18 sm:w-20 sm:h-20',
    lg: 'w-20 h-20 sm:w-24 sm:h-24'
  };

  const buttonSizes = {
    xs: 'w-4.5 h-4.5 sm:w-5 sm:h-5',
    sm: 'w-6 h-6 sm:w-7 sm:h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-9 h-9 sm:w-11 sm:h-11'
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5 stroke-[2.5]',
    sm: 'w-3.5 h-3.5 stroke-[2.5]',
    md: 'w-4 h-4 stroke-[2.5]',
    lg: 'w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]'
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group cursor-pointer inline-flex items-center justify-center select-none ${className}`}
      title="Ascendant • Everyday Academic Companion"
    >
      {/* Soft clay shadow */}
      <div className="absolute inset-0 rounded-full bg-[#B7A89A]/30 blur-md group-hover:blur-lg transition-all duration-300 pointer-events-none" />

      {/* SVG Container with Circular Text Path */}
      <div className={`relative ${containerSizes[size]} flex items-center justify-center`}>
        {/* Spinning Circular Text Ring in Deep Burgundy */}
        <svg
          viewBox="0 0 200 200"
          className={`w-full h-full transform-gpu ${
            isHovered ? 'animate-[spin_9s_linear_infinite]' : 'animate-[spin_24s_linear_infinite]'
          }`}
        >
          <defs>
            <path
              id="clayTextCircle"
              d="M 100, 100 m -76, 0 a 76,76 0 1,1 152,0 a 76,76 0 1,1 -152,0"
            />
          </defs>
          <text className="text-[11px] font-sans uppercase tracking-[0.22em] fill-[#722f37] font-extrabold opacity-85">
            <textPath href="#clayTextCircle" startOffset="0%">
              • ACADEMIC COMPANION • SIMPLE & CLEAR • 100% PRIVATE • TRACK GOALS •
            </textPath>
          </text>
        </svg>

        {/* Central Tactile Claymorphic Medallion */}
        <div className={`absolute ${medallionSizes[size]} rounded-full bg-gradient-to-br from-[#FDF8F0] via-[#E8DCC6] to-[#D8C9B0] border-2 border-white/80 shadow-[6px_6px_14px_rgba(114,47,55,0.12),-4px_-4px_10px_rgba(255,255,255,0.95),inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(183,168,154,0.35)] flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-105`}>
          {/* Inner stitched circle */}
          <div className="absolute inset-1.5 rounded-full border border-dashed border-[#B7A89A]/60 pointer-events-none" />

          {/* Deep Burgundy Pill Arrow Button */}
          <div className="relative flex flex-col items-center justify-center">
            <div className={`${buttonSizes[size]} rounded-full bg-gradient-to-br from-[#853740] via-[#722f37] to-[#592128] border border-white/30 shadow-[2px_2px_6px_rgba(114,47,55,0.3),inset_1.5px_1.5px_2px_rgba(255,255,255,0.4),inset_-1.5px_-1.5px_2px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all duration-300 group-hover:-translate-y-0.5`}>
              <ArrowUp className={`${iconSizes[size]} text-[#FAF6EE]`} />
            </div>
            {size !== 'sm' && (
              <span className="text-[8px] sm:text-[9px] font-sans text-[#722f37] uppercase font-black tracking-wider mt-0.5">
                ASCEND
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
