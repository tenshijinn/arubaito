import React from 'react';
import talentStar from '@/assets/talent-star.png';

export type QuadrantType = 'love' | 'needs' | 'paidFor' | 'goodAt' | null;

interface IkigaiDiagramProps {
  whatYouLove: string;
  whatWorldNeeds: string;
  whatPaidFor: string;
  whatGoodAt: string;
  isDarkMode: boolean;
  activeQuadrant?: QuadrantType;
  onQuadrantHover?: (quadrant: QuadrantType) => void;
  onQuadrantClick?: (quadrant: QuadrantType) => void;
}

const IkigaiDiagram: React.FC<IkigaiDiagramProps> = ({
  whatYouLove,
  whatWorldNeeds,
  whatPaidFor,
  whatGoodAt,
  isDarkMode,
  activeQuadrant = null,
  onQuadrantHover,
  onQuadrantClick,
}) => {
  const accentColor = "hsl(var(--primary))";
  const textColor = isDarkMode ? "hsl(0 0% 100%)" : "hsl(0 0% 9%)";
  const mutedColor = isDarkMode ? "hsl(0 0% 100% / 0.5)" : "hsl(0 0% 9% / 0.5)";
  
  // Calculate opacity for each circle based on active quadrant
  const getCircleOpacity = (quadrant: QuadrantType): number => {
    if (!activeQuadrant) return 0.8;
    return activeQuadrant === quadrant ? 1 : 0.2;
  };

  const getTextOpacity = (quadrant: QuadrantType): number => {
    if (!activeQuadrant) return 1;
    return activeQuadrant === quadrant ? 1 : 0.3;
  };

  const handleMouseEnter = (quadrant: QuadrantType) => {
    onQuadrantHover?.(quadrant);
  };

  const handleMouseLeave = () => {
    onQuadrantHover?.(null);
  };

  const handleClick = (quadrant: QuadrantType) => {
    onQuadrantClick?.(quadrant);
  };
  
  // Helper to split text into lines if over 12 chars
  const wrapText = (
    text: string,
    maxLen: number = 12,
    maxLines: number = 2
  ): string[] => {
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
    
    return lines.slice(0, maxLines);
  };

  // Render multi-line text
  const renderWrappedText = (
    text: string, 
    x: number, 
    y: number, 
    anchor: 'start' | 'middle' | 'end' = 'middle',
    maxLen: number = 12,
    maxLines: number = 2
  ) => {
    const lines = wrapText(text, maxLen, maxLines);
    const lineHeight = 14;
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    const initialDy = startY - y;
    
    return lines.map((line, i) => (
      <tspan 
        key={i} 
        x={x} 
        dy={i === 0 ? initialDy : lineHeight}
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
      <defs>
        {/* Masks to keep side-circle text in the non-overlapping lobes (prevents crossing other circle perimeters) */}
        <mask id="ikigai-right-lobe">
          <rect x="0" y="0" width="500" height="500" fill="black" />
          <circle cx="325" cy="250" r="110" fill="white" />
          <circle cx="250" cy="175" r="110" fill="black" />
          <circle cx="250" cy="325" r="110" fill="black" />
          <circle cx="175" cy="250" r="110" fill="black" />
        </mask>
        <mask id="ikigai-left-lobe">
          <rect x="0" y="0" width="500" height="500" fill="black" />
          <circle cx="175" cy="250" r="110" fill="white" />
          <circle cx="250" cy="175" r="110" fill="black" />
          <circle cx="250" cy="325" r="110" fill="black" />
          <circle cx="325" cy="250" r="110" fill="black" />
        </mask>
      </defs>

      {/* Circles - dotted stroke - larger for better visibility */}
      {/* Top circle - What you love */}
      <g
        onMouseEnter={() => handleMouseEnter('love')}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleClick('love')}
        style={{ cursor: 'pointer' }}
      >
        <circle
          cx="250"
          cy="175"
          r="110"
          fill="transparent"
          stroke={accentColor}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity={getCircleOpacity('love')}
          style={{ transition: 'opacity 0.3s ease' }}
        />
      </g>
      
      {/* Right circle - What the world needs */}
      <g
        onMouseEnter={() => handleMouseEnter('needs')}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleClick('needs')}
        style={{ cursor: 'pointer' }}
      >
        <circle
          cx="325"
          cy="250"
          r="110"
          fill="transparent"
          stroke={accentColor}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity={getCircleOpacity('needs')}
          style={{ transition: 'opacity 0.3s ease' }}
        />
      </g>
      
      {/* Bottom circle - What you can be paid for */}
      <g
        onMouseEnter={() => handleMouseEnter('paidFor')}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleClick('paidFor')}
        style={{ cursor: 'pointer' }}
      >
        <circle
          cx="250"
          cy="325"
          r="110"
          fill="transparent"
          stroke={accentColor}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity={getCircleOpacity('paidFor')}
          style={{ transition: 'opacity 0.3s ease' }}
        />
      </g>
      
      {/* Left circle - What you are good at */}
      <g
        onMouseEnter={() => handleMouseEnter('goodAt')}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleClick('goodAt')}
        style={{ cursor: 'pointer' }}
      >
        <circle
          cx="175"
          cy="250"
          r="110"
          fill="transparent"
          stroke={accentColor}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity={getCircleOpacity('goodAt')}
          style={{ transition: 'opacity 0.3s ease' }}
        />
      </g>

      {/* Center star */}
      <image
        href={talentStar}
        x="214"
        y="214"
        width="72"
        height="72"
        opacity="0.95"
        preserveAspectRatio="xMidYMid meet"
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
      <text x="250" y="110" textAnchor="middle" fill={textColor} fontSize="12" opacity={getTextOpacity('love')} style={{ transition: 'opacity 0.3s ease' }}>
        <tspan fill={mutedColor}>what you </tspan>
        <tspan fill={accentColor}>love</tspan>
      </text>
      <text x="250" y="128" textAnchor="middle" fill={textColor} fontSize="11" opacity={getTextOpacity('love')} style={{ transition: 'opacity 0.3s ease' }}>
        {renderWrappedText(whatYouLove || '', 250, 128, 'middle', 15)}
      </text>
      
      {/* Right - What the world needs - RIGHT ALIGNED */}
      <g mask="url(#ikigai-right-lobe)" opacity={getTextOpacity('needs')} style={{ transition: 'opacity 0.3s ease' }}>
        <text x="418" y="240" textAnchor="end" fill={textColor} fontSize="12">
          <tspan fill={mutedColor}>what the</tspan>
        </text>
        <text x="418" y="255" textAnchor="end" fill={textColor} fontSize="12">
          <tspan fill={mutedColor}>world </tspan>
          <tspan fill={accentColor}>needs</tspan>
        </text>
        <text x="418" y="275" textAnchor="end" fill={textColor} fontSize="11">
          {renderWrappedText(whatWorldNeeds || '', 418, 275, 'end', 10, 3)}
        </text>
      </g>
      
      {/* Bottom - What you can be paid for */}
      <text x="250" y="375" textAnchor="middle" fill={textColor} fontSize="12" opacity={getTextOpacity('paidFor')} style={{ transition: 'opacity 0.3s ease' }}>
        <tspan fill={mutedColor}>what you can be</tspan>
      </text>
      <text x="250" y="390" textAnchor="middle" fill={accentColor} fontSize="12" opacity={getTextOpacity('paidFor')} style={{ transition: 'opacity 0.3s ease' }}>
        paid for
      </text>
      <text x="250" y="410" textAnchor="middle" fill={textColor} fontSize="11" opacity={getTextOpacity('paidFor')} style={{ transition: 'opacity 0.3s ease' }}>
        {renderWrappedText(whatPaidFor || '', 250, 410, 'middle', 15)}
      </text>
      
      {/* Left - What you are good at - LEFT ALIGNED */}
      <g mask="url(#ikigai-left-lobe)" opacity={getTextOpacity('goodAt')} style={{ transition: 'opacity 0.3s ease' }}>
        <text x="82" y="240" textAnchor="start" fill={textColor} fontSize="12">
          <tspan fill={mutedColor}>what you are</tspan>
        </text>
        <text x="82" y="255" textAnchor="start" fill={accentColor} fontSize="12">
          good at
        </text>
        <text x="82" y="275" textAnchor="start" fill={textColor} fontSize="11">
          {renderWrappedText(whatGoodAt || '', 82, 275, 'start', 10, 3)}
        </text>
      </g>
    </svg>
  );
};

export default IkigaiDiagram;