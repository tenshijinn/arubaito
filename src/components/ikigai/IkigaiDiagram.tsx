import React from 'react';

interface IkigaiDiagramProps {
  whatYouLove: string;
  whatWorldNeeds: string;
  whatPaidFor: string;
  whatGoodAt: string;
  isDarkMode: boolean;
}

const IkigaiDiagram: React.FC<IkigaiDiagramProps> = ({
  whatYouLove,
  whatWorldNeeds,
  whatPaidFor,
  whatGoodAt,
  isDarkMode,
}) => {
  const accentColor = "#ed565a";
  const textColor = isDarkMode ? "#ffffff" : "#181818";
  const mutedColor = isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(24,24,24,0.5)";
  
  // Helper to truncate text for diagram display
  const truncate = (text: string, maxLen: number = 20) => {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen - 3) + "...";
  };

  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-full max-w-[400px] max-h-[400px]"
      style={{ fontFamily: 'Consolas, monospace' }}
    >
      {/* Circles - dotted stroke */}
      {/* Top circle - What you love */}
      <circle
        cx="200"
        cy="140"
        r="90"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.8"
      />
      
      {/* Right circle - What the world needs */}
      <circle
        cx="260"
        cy="200"
        r="90"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.8"
      />
      
      {/* Bottom circle - What you can be paid for */}
      <circle
        cx="200"
        cy="260"
        r="90"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.8"
      />
      
      {/* Left circle - What you are good at */}
      <circle
        cx="140"
        cy="200"
        r="90"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.8"
      />

      {/* Center star/diamond */}
      <polygon
        points="200,175 225,200 200,225 175,200"
        fill={accentColor}
        opacity="0.9"
      />

      {/* Outer labels */}
      {/* Top - OBSESSION */}
      <text x="200" y="30" textAnchor="middle" fill={mutedColor} fontSize="10" fontWeight="bold" letterSpacing="2">
        OBSESSION
      </text>
      
      {/* Right - PROBLEM */}
      <text x="370" y="200" textAnchor="middle" fill={mutedColor} fontSize="10" fontWeight="bold" letterSpacing="2" transform="rotate(90, 370, 200)">
        PROBLEM
      </text>
      
      {/* Bottom - OFFERING */}
      <text x="200" y="385" textAnchor="middle" fill={mutedColor} fontSize="10" fontWeight="bold" letterSpacing="2">
        OFFERING
      </text>
      
      {/* Left - SKILL */}
      <text x="30" y="200" textAnchor="middle" fill={mutedColor} fontSize="10" fontWeight="bold" letterSpacing="2" transform="rotate(-90, 30, 200)">
        SKILL
      </text>

      {/* Intersection labels */}
      {/* Top-right - MISSION */}
      <text x="245" y="145" textAnchor="middle" fill={textColor} fontSize="8" fontWeight="bold" opacity="0.7">
        MISSION
      </text>
      
      {/* Bottom-right - VOCATION */}
      <text x="245" y="265" textAnchor="middle" fill={textColor} fontSize="8" fontWeight="bold" opacity="0.7">
        VOCATION
      </text>
      
      {/* Bottom-left - PROFESSION */}
      <text x="155" y="265" textAnchor="middle" fill={textColor} fontSize="8" fontWeight="bold" opacity="0.7">
        PROFESSION
      </text>
      
      {/* Top-left - PASSION */}
      <text x="155" y="145" textAnchor="middle" fill={textColor} fontSize="8" fontWeight="bold" opacity="0.7">
        PASSION
      </text>

      {/* User input text - positioned in each circle */}
      {/* Top - What you love */}
      <text x="200" y="95" textAnchor="middle" fill={textColor} fontSize="11" fontWeight="500">
        {truncate(whatYouLove) || "what you love"}
      </text>
      
      {/* Right - What the world needs */}
      <text x="305" y="200" textAnchor="middle" fill={textColor} fontSize="11" fontWeight="500">
        {truncate(whatWorldNeeds) || "world needs"}
      </text>
      
      {/* Bottom - What you can be paid for */}
      <text x="200" y="315" textAnchor="middle" fill={textColor} fontSize="11" fontWeight="500">
        {truncate(whatPaidFor) || "paid for"}
      </text>
      
      {/* Left - What you are good at */}
      <text x="95" y="200" textAnchor="middle" fill={textColor} fontSize="11" fontWeight="500">
        {truncate(whatGoodAt) || "good at"}
      </text>
    </svg>
  );
};

export default IkigaiDiagram;
