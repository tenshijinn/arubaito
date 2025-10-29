interface PresetButtonProps {
  text: string;
  onClick: () => void;
  variant?: 'default' | 'compact';
}

export const PresetButton = ({ text, onClick, variant = 'default' }: PresetButtonProps) => {
  const baseClasses = "text-left font-mono transition-colors duration-200";
  
  const variantClasses = {
    default: "w-full px-4 py-2 text-sm border border-primary/30 rounded hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary",
    compact: "inline-block px-3 py-1.5 text-xs border border-primary/20 rounded hover:border-primary/50 text-muted-foreground hover:text-primary"
  };
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      &gt; {text}
    </button>
  );
};
