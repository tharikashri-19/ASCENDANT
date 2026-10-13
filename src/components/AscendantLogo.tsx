import React from 'react';

interface AscendantLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  tagline?: string;
}

export default function AscendantLogo({
  className = '',
  size = 'md',
  showText = true,
  tagline = 'Academic Companion'
}: AscendantLogoProps) {
  const sizeMap = {
    sm: { box: 'w-8 h-8', text: 'text-sm', badge: 'text-[9px]' },
    md: { box: 'w-10 h-10', text: 'text-lg', badge: 'text-[10px]' },
    lg: { box: 'w-14 h-14', text: 'text-2xl', badge: 'text-xs' },
    xl: { box: 'w-20 h-20', text: 'text-4xl', badge: 'text-sm' }
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Tactile Claymorphic Arrow Squircle */}
      <div className={`relative ${currentSize.box} flex items-center justify-center shrink-0`}>
        {/* Soft clay drop shadow */}
        <div className="absolute inset-0 rounded-[18px] bg-[#B7A89A]/30 blur-sm pointer-events-none" />

        {/* Claymorphic Emblem Squircle */}
        <div className="relative w-full h-full rounded-[16px] sm:rounded-[18px] bg-gradient-to-br from-[#853740] via-[#722f37] to-[#592128] border border-white/40 shadow-[4px_4px_12px_rgba(114,47,55,0.25),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.25)] flex items-center justify-center">
          {/* Ascending Chevron / Arrow Vector */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-3/5 h-3/5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          >
            <path
              d="M16 6L25 15H19V25H13V15H7L16 6Z"
              fill="#FAF6EE"
            />
            <path
              d="M16 10L22 16H18V23H14V16H10L16 10Z"
              fill="#E8DCC6"
            />
            {/* Soft upward chevron accent */}
            <path
              d="M13 19L16 16L19 19"
              stroke="#722f37"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Wordmark with clear, friendly contrast */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-tight text-[#722f37] font-sans ${currentSize.text}`}>
              ASCENDANT
            </span>
            <span className="w-2 h-2 rounded-full bg-[#722f37] opacity-80" />
          </div>
          {tagline && (
            <span className={`font-sans font-semibold text-[#8C7D70] tracking-wide mt-0.5 ${currentSize.badge}`}>
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
