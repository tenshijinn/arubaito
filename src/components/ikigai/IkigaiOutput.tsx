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
      
      // "I'm" in red, name in white
      parts.push({ text: "I'm ", highlight: true });
      parts.push({ text: name + "!", highlight: false });
      
      // Parse the rest for role and mission
      // Look for "I am a {role} that helps {mission}"
      const rolePattern = /I am a (.+?) that helps (.+)/i;
      const roleMatch = afterName.match(rolePattern);
      
      if (roleMatch) {
        parts.push({ text: ' I am a ', highlight: false });
        parts.push({ text: roleMatch[1], highlight: false }); // Role in white
        parts.push({ text: ' that helps ', highlight: true }); // "that helps" in red
        
        // Split mission to handle "to find" pattern
        const missionText = roleMatch[2];
        const toFindMatch = missionText.match(/(.+?)(to find)(.+)/i);
        
        if (toFindMatch) {
          parts.push({ text: toFindMatch[1], highlight: false });
          parts.push({ text: 'to find', highlight: true });
          parts.push({ text: toFindMatch[3], highlight: false });
        } else {
          parts.push({ text: missionText, highlight: false });
        }
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
    <div className="py-6">
      <p 
        className={`text-xl md:text-2xl leading-relaxed ${textColor}`} 
        style={{ fontFamily: 'Consolas, monospace', fontStyle: 'italic' }}
      >
        {parts.map((part, index) => (
          <span key={index} className={part.highlight ? 'text-primary' : ''}>
            {part.text}
          </span>
        ))}
      </p>
    </div>
  );
};

export default IkigaiOutput;