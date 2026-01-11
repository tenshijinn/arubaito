import { ExternalLink } from "lucide-react";

interface MessageContentProps {
  content: string;
}

export const MessageContent = ({ content }: MessageContentProps) => {
  // Parse content and convert markdown patterns to React elements
  const parseContent = (text: string) => {
    const elements: (string | JSX.Element)[] = [];
    let keyIndex = 0;

    // Split by lines first to handle separators
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      // Handle horizontal rule (---)
      if (line.trim() === '---') {
        elements.push(
          <div key={`sep-${keyIndex++}`} className="my-4 border-t border-primary/30" />
        );
        return;
      }

      // Handle numbered titles (1. Title, 2. Title, etc.) - render with highlight
      const titleMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (titleMatch) {
        const number = titleMatch[1];
        const titleContent = titleMatch[2];
        const parsedTitle = parseLine(titleContent, keyIndex);
        keyIndex += parsedTitle.keyCount;
        elements.push(
          <div key={`title-${keyIndex++}`} className="font-bold text-foreground mt-3 first:mt-0">
            <span className="bg-primary/15 px-1 rounded-sm">{number}. {parsedTitle.elements}</span>
          </div>
        );
        if (lineIndex < lines.length - 1) {
          elements.push('\n');
        }
        return;
      }

      // Handle > chevron prefix for details lines (company/location/pay)
      if (line.trim().startsWith('> ') && !line.trim().startsWith('>> ')) {
        const innerContent = line.trim().substring(2);
        const parsedInner = parseLine(innerContent, keyIndex);
        keyIndex += parsedInner.keyCount;
        elements.push(
          <div key={`chevron-${keyIndex++}`} className="flex items-start gap-2 text-muted-foreground">
            <span className="text-primary/70 font-mono">▶</span>
            <span>{parsedInner.elements}</span>
          </div>
        );
        if (lineIndex < lines.length - 1) {
          elements.push('\n');
        }
        return;
      }

      // Handle >> action prefix (apply links)
      if (line.trim().startsWith('>> ')) {
        const innerContent = line.trim().substring(3);
        const parsedInner = parseLine(innerContent, keyIndex);
        keyIndex += parsedInner.keyCount;
        elements.push(
          <div key={`action-${keyIndex++}`} className="flex items-center gap-2 mt-1">
            <span className="text-primary font-mono">»</span>
            <span>{parsedInner.elements}</span>
          </div>
        );
        if (lineIndex < lines.length - 1) {
          elements.push('\n');
        }
        return;
      }

      // Parse the line for markdown links and bold text
      const parsedLine = parseLine(line, keyIndex);
      keyIndex += parsedLine.keyCount;
      elements.push(...parsedLine.elements);
      
      // Add line break if not last line
      if (lineIndex < lines.length - 1) {
        elements.push('\n');
      }
    });

    return elements;
  };

  const parseLine = (line: string, startKey: number) => {
    const elements: (string | JSX.Element)[] = [];
    let keyCount = 0;
    let remaining = line;

    // Pattern for markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    // Pattern for bold: **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;

    // Combined pattern to match either
    const combinedRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g;
    
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(line)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        elements.push(line.substring(lastIndex, match.index));
      }

      const fullMatch = match[1];
      
      if (fullMatch.startsWith('[')) {
        // It's a link
        const linkText = match[2];
        const url = match[3];
        elements.push(
          <a
            key={`link-${startKey + keyCount++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-0.5 border border-primary/50 rounded hover:bg-primary/10 hover:border-primary transition-colors text-primary underline-offset-2"
          >
            {linkText}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      } else if (fullMatch.startsWith('**')) {
        // It's bold text - render as emphasized span without asterisks
        const boldText = match[4];
        elements.push(
          <span key={`bold-${startKey + keyCount++}`} className="text-primary font-medium">
            {boldText}
          </span>
        );
      }

      lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text after last match
    if (lastIndex < line.length) {
      elements.push(line.substring(lastIndex));
    }

    return { elements, keyCount };
  };

  return (
    <div className="whitespace-pre-wrap">
      {parseContent(content)}
    </div>
  );
};
