interface GoldenCheckmarkProps {
  size?: number;
  className?: string;
}

export const GoldenCheckmark = ({ size = 16, className = "" }: GoldenCheckmarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* X/Twitter verified badge shape */}
    <path
      d="M22.25 12.04L20.17 9.71L20.45 6.6L17.4 5.89L15.85 3.25L12.92 4.45L10 3.25L8.45 5.89L5.4 6.59L5.68 9.71L3.6 12.04L5.68 14.37L5.4 17.49L8.45 18.2L10 20.84L12.92 19.63L15.85 20.83L17.4 18.19L20.45 17.48L20.17 14.37L22.25 12.04Z"
      fill="url(#gold_gradient)"
    />
    {/* Checkmark */}
    <path
      d="M10.09 15.59L7.5 13L8.91 11.59L10.09 12.76L14.93 7.92L16.34 9.33L10.09 15.59Z"
      fill="#1A1A1A"
    />
    <defs>
      <linearGradient id="gold_gradient" x1="3.6" y1="3.25" x2="22.25" y2="20.84" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F5D16F" />
        <stop offset="0.5" stopColor="#D4A934" />
        <stop offset="1" stopColor="#B8860B" />
      </linearGradient>
    </defs>
  </svg>
);
