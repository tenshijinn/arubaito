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
  
  // Helper to split text into lines if over 12 chars
  const wrapText = (text: string, maxLen: number = 12): string[] => {
    if (!text || text.length <= maxLen) return [text || ''];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxLen) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word.length > maxLen ? word.substring(0, maxLen - 2) + '..' : word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines.slice(0, 2); // Max 2 lines
  };

  // Render multi-line text
  const renderWrappedText = (
    text: string, 
    x: number, 
    y: number, 
    anchor: 'start' | 'middle' | 'end' = 'middle',
    maxLen: number = 12
  ) => {
    const lines = wrapText(text, maxLen);
    const lineHeight = 14;
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    
    return lines.map((line, i) => (
      <tspan 
        key={i} 
        x={x} 
        dy={i === 0 ? 0 : lineHeight}
        textAnchor={anchor}
      >
        {line}
      </tspan>
    ));
  };

  return (
    <svg
      viewBox="0 0 500 500"
      className="w-full h-full"
      style={{ fontFamily: 'Consolas, monospace' }}
    >
      {/* Circles - dotted stroke - larger for better visibility */}
      {/* Top circle - What you love */}
      <circle
        cx="250"
        cy="175"
        r="110"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.8"
      />
      
      {/* Right circle - What the world needs */}
      <circle
        cx="325"
        cy="250"
        r="110"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.8"
      />
      
      {/* Bottom circle - What you can be paid for */}
      <circle
        cx="250"
        cy="325"
        r="110"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.8"
      />
      
      {/* Left circle - What you are good at */}
      <circle
        cx="175"
        cy="250"
        r="110"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.8"
      />

      {/* Center star/diamond */}
      <polygon
        points="250,220 280,250 250,280 220,250"
        fill={isDarkMode ? "#faf1e1" : accentColor}
        opacity="0.9"
      />

      {/* Outer labels */}
      {/* Top - OBSESSION */}
      <text x="250" y="35" textAnchor="middle" fill={mutedColor} fontSize="11" fontWeight="bold" letterSpacing="2">
        OBSESSION
      </text>
      
      {/* Right - PROBLEM */}
      <text x="465" y="250" textAnchor="middle" fill={mutedColor} fontSize="11" fontWeight="bold" letterSpacing="2" transform="rotate(90, 465, 250)">
        PROBLEM
      </text>
      
      {/* Bottom - OFFERING */}
      <text x="250" y="480" textAnchor="middle" fill={mutedColor} fontSize="11" fontWeight="bold" letterSpacing="2">
        OFFERING
      </text>
      
      {/* Left - SKILL */}
      <text x="35" y="250" textAnchor="middle" fill={mutedColor} fontSize="11" fontWeight="bold" letterSpacing="2" transform="rotate(-90, 35, 250)">
        SKILL
      </text>

      {/* Intersection labels - in red/primary color */}
      {/* Top-right - MISSION */}
      <text x="305" y="180" textAnchor="middle" fill={accentColor} fontSize="10" fontWeight="bold" opacity="0.9">
        MISSION
      </text>
      
      {/* Bottom-right - VOCATION */}
      <text x="305" y="330" textAnchor="middle" fill={accentColor} fontSize="10" fontWeight="bold" opacity="0.9">
        VOCATION
      </text>
      
      {/* Bottom-left - PROFESSION */}
      <text x="195" y="330" textAnchor="middle" fill={accentColor} fontSize="10" fontWeight="bold" opacity="0.9">
        PROFESSION
      </text>
      
      {/* Top-left - PASSION */}
      <text x="195" y="180" textAnchor="middle" fill={accentColor} fontSize="10" fontWeight="bold" opacity="0.9">
        PASSION
      </text>

      {/* User input text - positioned in each circle with word wrap */}
      {/* Top - What you love - with "what you" prefix and "love" highlighted */}
      <text x="250" y="110" textAnchor="middle" fill={textColor} fontSize="12">
        <tspan fill={mutedColor}>what you </tspan>
        <tspan fill={accentColor}>love</tspan>
      </text>
      <text x="250" y="128" textAnchor="middle" fill={textColor} fontSize="11">
        {renderWrappedText(whatYouLove || '', 250, 128, 'middle', 15)}
      </text>
      
      {/* Right - What the world needs - RIGHT ALIGNED */}
      <text x="370" y="240" textAnchor="end" fill={textColor} fontSize="12">
        <tspan fill={mutedColor}>what the</tspan>
      </text>
      <text x="370" y="255" textAnchor="end" fill={textColor} fontSize="12">
        <tspan fill={mutedColor}>world </tspan>
        <tspan fill={accentColor}>needs</tspan>
      </text>
      <text x="370" y="275" textAnchor="end" fill={textColor} fontSize="11">
        {renderWrappedText(whatWorldNeeds || '', 370, 275, 'end', 12)}
      </text>
      
      {/* Bottom - What you can be paid for */}
      <text x="250" y="375" textAnchor="middle" fill={textColor} fontSize="12">
        <tspan fill={mutedColor}>what you can be</tspan>
      </text>
      <text x="250" y="390" textAnchor="middle" fill={accentColor} fontSize="12">
        paid for
      </text>
      <text x="250" y="410" textAnchor="middle" fill={textColor} fontSize="11">
        {renderWrappedText(whatPaidFor || '', 250, 410, 'middle', 15)}
      </text>
      
      {/* Left - What you are good at - LEFT ALIGNED */}
      <text x="130" y="240" textAnchor="start" fill={textColor} fontSize="12">
        <tspan fill={mutedColor}>what you are</tspan>
      </text>
      <text x="130" y="255" textAnchor="start" fill={accentColor} fontSize="12">
        good at
      </text>
      <text x="130" y="275" textAnchor="start" fill={textColor} fontSize="11">
        {renderWrappedText(whatGoodAt || '', 130, 275, 'start', 12)}
      </text>
    </svg>
  );
};

export default IkigaiDiagram;