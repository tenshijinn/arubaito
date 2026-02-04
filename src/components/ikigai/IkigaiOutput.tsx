import React from 'react';

interface IkigaiOutputProps {
  statement: string;
  name: string;
  isDarkMode: boolean;
}

const IkigaiOutput: React.FC<IkigaiOutputProps> = ({ statement, name, isDarkMode }) => {
  if (!statement) return null;

  const textColor = isDarkMode ? 'text-white' : 'text-[#181818]';
  
  // Parse the statement to highlight specific parts
  // Format: "I'm {Name}! I am a {role} that helps {mission}."
  const parseStatement = () => {
    const parts: { text: string; highlight: boolean }[] = [];
    
    // Find "I'm Name!" part
    const namePattern = new RegExp(`(I'm\\s+${name}!)`, 'i');
    const nameMatch = statement.match(namePattern);
    
    if (nameMatch) {
      const beforeName = statement.substring(0, nameMatch.index);
      const nameText = nameMatch[1];
      const afterName = statement.substring((nameMatch.index || 0) + nameText.length);
      
      if (beforeName) parts.push({ text: beforeName, highlight: false });
      parts.push({ text: nameText, highlight: false }); // Name stays normal color
      
      // Parse the rest for role and mission
      // Look for "I am a {role} that helps {mission}"
      const rolePattern = /I am a (.+?) that helps (.+)/i;
      const roleMatch = afterName.match(rolePattern);
      
      if (roleMatch) {
        const beforeRole = afterName.substring(0, roleMatch.index);
        if (beforeRole) parts.push({ text: beforeRole, highlight: false });
        
        parts.push({ text: 'I am a ', highlight: false });
        parts.push({ text: roleMatch[1], highlight: true }); // Role in red
        parts.push({ text: ' that helps ', highlight: false });
        parts.push({ text: roleMatch[2], highlight: true }); // Mission in red
      } else {
        parts.push({ text: afterName, highlight: false });
      }
    } else {
      // Fallback: just return the whole statement
      parts.push({ text: statement, highlight: false });
    }
    
    return parts;
  };

  const parts = parseStatement();

  return (
    <div className="mt-8 p-6 border-t border-current/20">
      <p className={`text-lg leading-relaxed ${textColor}`} style={{ fontFamily: 'Consolas, monospace' }}>
        {parts.map((part, index) => (
          <span key={index} className={part.highlight ? 'text-primary font-semibold' : ''}>
            {part.text}
          </span>
        ))}
      </p>
    </div>
  );
};

export default IkigaiOutput;
