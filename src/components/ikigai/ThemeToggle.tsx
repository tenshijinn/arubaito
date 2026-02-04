import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, onToggle }) => {
  return (
    <div className="flex items-center gap-3">
      <Label 
        htmlFor="theme-toggle" 
        className={`text-xs tracking-widest cursor-pointer ${
          isDarkMode ? 'text-white/60' : 'text-[#181818]/60'
        }`}
      >
        LIGHT/DARK MODE
      </Label>
      <Switch
        id="theme-toggle"
        checked={isDarkMode}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300"
      />
    </div>
  );
};

export default ThemeToggle;
