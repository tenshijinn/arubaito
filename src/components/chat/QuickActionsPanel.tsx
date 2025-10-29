import { PresetCategory } from './chatPresets';
import { PresetButton } from './PresetButton';

interface QuickActionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  categories: PresetCategory[];
  onSelect: (preset: string) => void;
}

export const QuickActionsPanel = ({ isOpen, onClose, categories, onSelect }: QuickActionsPanelProps) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Panel */}
      <div className={`
        fixed bottom-0 left-0 right-0 
        bg-background/95 backdrop-blur-sm 
        border-t-2 border-primary/30 
        font-mono text-sm
        transform transition-transform duration-300 ease-out
        z-50
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-primary text-sm">QUICK COMMANDS</span>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              [X]
            </button>
          </div>
          
          {/* Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
            {categories.map(category => (
              <div key={category.name}>
                <div className="text-primary mb-3 text-xs">// {category.name}</div>
                <div className="space-y-2">
                  {category.prompts.map((prompt, idx) => (
                    <PresetButton
                      key={idx}
                      text={prompt}
                      onClick={() => {
                        onSelect(prompt);
                        onClose();
                      }}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
