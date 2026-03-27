interface NSIconProps {
  size?: number;
  className?: string;
  color?: string;
}

export const NSIcon = ({ size = 16, className = "", color = "currentColor" }: NSIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Open book / Network School icon */}
    <path
      d="M2 4C2 4 5 2 12 2C19 2 22 4 22 4V20C22 20 19 18.5 12 18.5C5 18.5 2 20 2 20V4Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 2V18.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Page lines left */}
    <path d="M6 7H10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M6 10H9" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    {/* Page lines right */}
    <path d="M14 7H18" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M15 10H18" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
