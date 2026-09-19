import React from 'react';

/**
 * REPP Logo Component
 * Recreates the exact first REPP logo concept:
 * Bold, italic, futuristic "REPP" wordmark with white lettering on dark background
 * and neon-lime accent on the top bar of the "E".
 * Slogan: "TRAIN SMART. LIVE STRONG."
 */
export default function ReppLogo({ size = 'md', showTagline = true, className = '' }) {
  // Size mapping
  const sizes = {
    sm: { width: 110, height: 38, fontSize: 24, taglineSize: 7 },
    md: { width: 160, height: 54, fontSize: 36, taglineSize: 9.5 },
    lg: { width: 220, height: 75, fontSize: 48, taglineSize: 12 },
    hero: { width: 320, height: 110, fontSize: 68, taglineSize: 16 }
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <svg
        width={currentSize.width}
        height={currentSize.height}
        viewBox="0 0 280 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto h-auto"
      >
        {/* R */}
        <g transform="skewX(-14)">
          {/* R Stem */}
          <path d="M 20 20 H 34 V 68 H 20 Z" fill="#FFFFFF" />
          {/* R Loop */}
          <path d="M 34 20 H 52 C 60 20 66 25 66 32 C 66 39 60 44 52 44 H 34 V 20 Z M 48 33 H 50 C 53 33 54 31 54 32 C 54 31 53 30 50 30 H 48 V 33 Z" fill="#FFFFFF" />
          {/* R Leg */}
          <path d="M 44 42 L 62 68 H 47 L 33 46 H 44 Z" fill="#FFFFFF" />

          {/* E */}
          {/* Top Bar of E - NEON LIME ACCENT */}
          <path d="M 76 20 H 112 V 29 H 76 Z" fill="#C6FF00" />
          {/* Middle & Bottom & Stem of E - WHITE */}
          <path d="M 76 20 H 89 V 68 H 76 Z" fill="#FFFFFF" />
          <path d="M 89 40 H 108 V 48 H 89 Z" fill="#FFFFFF" />
          <path d="M 89 59 H 114 V 68 H 89 Z" fill="#FFFFFF" />

          {/* P (First) */}
          <path d="M 124 20 H 138 V 68 H 124 Z" fill="#FFFFFF" />
          <path d="M 138 20 H 158 C 166 20 172 25 172 34 C 172 43 166 48 158 48 H 138 V 20 Z M 152 34 C 154 34 156 33 156 34 C 156 33 154 30 152 30 H 138 V 38 H 152 Z" fill="#FFFFFF" />

          {/* P (Second) */}
          <path d="M 182 20 H 196 V 68 H 182 Z" fill="#FFFFFF" />
          <path d="M 196 20 H 216 C 224 20 230 25 230 34 C 230 43 224 48 216 48 H 196 V 20 Z M 210 34 C 212 34 214 33 214 34 C 214 33 212 30 210 30 H 196 V 38 H 210 Z" fill="#FFFFFF" />
        </g>

        {/* TM Symbol */}
        <text x="238" y="24" fill="#94A3B8" fontSize="10" fontFamily="sans-serif" fontWeight="bold">TM</text>

        {/* Slogan */}
        {showTagline && (
          <g>
            <text
              x="125"
              y="84"
              fill="#E2E8F0"
              fontSize="12.5"
              fontFamily="sans-serif"
              fontWeight="800"
              letterSpacing="3.5"
              textAnchor="middle"
            >
              TRAIN SMART<tspan fill="#C6FF00">.</tspan> LIVE STRONG<tspan fill="#C6FF00">.</tspan>
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
