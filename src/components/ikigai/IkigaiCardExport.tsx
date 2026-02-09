import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { IkigaiDiagram } from './index';
import arubaitoLogo from '@/assets/arubaito-logo-transparent.png';

interface IkigaiCardExportProps {
  id: string;
  name: string;
  statement: string;
  whatYouLove: string;
  whatWorldNeeds: string;
  whatPaidFor: string;
  whatGoodAt: string;
  telegramHandle: string;
  isDarkMode: boolean;
}

const IkigaiCardExport: React.FC<IkigaiCardExportProps> = ({
  id,
  name,
  statement,
  whatYouLove,
  whatWorldNeeds,
  whatPaidFor,
  whatGoodAt,
  telegramHandle,
  isDarkMode,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  const bgColor = '#181818'; // Always dark for export
  const textColor = '#ffffff';
  const accentColor = '#ed565a';
  
  useEffect(() => {
    const generateQR = async () => {
      if (!telegramHandle || !name) return;

      const handle = telegramHandle.startsWith('@') 
        ? telegramHandle.substring(1) 
        : telegramHandle;

      const telegramMessage = `Hey ${name} — I came across your Ikigai Card and resonated with this:\n\n"I am a ${whatPaidFor} that helps ${whatWorldNeeds}."\n\nWould be great to connect.`;
      
      const encodedMessage = encodeURIComponent(telegramMessage);
      const telegramUrl = `https://t.me/${handle}?text=${encodedMessage}`;

      try {
        const url = await QRCode.toDataURL(telegramUrl, {
          width: 150,
          margin: 1,
          color: {
            dark: accentColor,
            light: bgColor,
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQR();
  }, [telegramHandle, name, whatPaidFor, whatWorldNeeds]);

  // Parse statement for highlighting keywords
  const renderStatement = () => {
    // Highlight "I'm", "that helps", and trailing period in accent
    const parts: { text: string; isAccent: boolean }[] = [];
    
    // Try to match "I'm {name}! I am a {role} that helps {mission}."
    const pattern = /^(I'm\s+)(.+?)(!\s*I am a\s+)(.+?)(\s+that helps\s+)(.+?)(\.)?\s*$/is;
    const match = statement.match(pattern);
    
    if (match) {
      parts.push({ text: "I'm ", isAccent: true });
      parts.push({ text: match[2] + "!", isAccent: false });
      parts.push({ text: " I am a " + match[4], isAccent: false });
      parts.push({ text: " that helps ", isAccent: true });
      parts.push({ text: match[6], isAccent: false });
      parts.push({ text: ".", isAccent: true });
    } else {
      parts.push({ text: statement, isAccent: false });
    }
    
    return parts;
  };

  const statementParts = renderStatement();

  const statementFontSize = statement.length > 160 ? '15px' 
    : statement.length > 120 ? '17px' 
    : statement.length > 80 ? '19px' 
    : '22px';

  const statementBlock = (
    <div style={{ 
      textAlign: 'center', 
      marginBottom: '16px',
      fontSize: statementFontSize,
      lineHeight: '1.4',
      fontStyle: 'italic',
    }}>
      {statementParts.map((part, i) => (
        <span key={i} style={{ color: part.isAccent ? accentColor : textColor }}>
          {part.text}
        </span>
      ))}
    </div>
  );

  return (
    <div
      id={id}
      style={{
        width: '430px',
        height: '932px',
        backgroundColor: bgColor,
        padding: '40px 30px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Consolas, monospace',
        color: textColor,
      }}
    >
      {/* Header with star and title */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ fontSize: '32px', color: '#faf1e1', marginBottom: '8px' }}>✦</div>
        <div style={{ 
          fontSize: '14px', 
          letterSpacing: '0.3em', 
          fontWeight: 'bold',
          textTransform: 'uppercase' as const,
        }}>
          IKIGAI CARD
        </div>
      </div>

      {statementBlock}

      {/* Diagram - centered and prominent */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <div style={{ width: '340px', height: '340px' }}>
          <IkigaiDiagram
            whatYouLove={whatYouLove}
            whatWorldNeeds={whatWorldNeeds}
            whatPaidFor={whatPaidFor}
            whatGoodAt={whatGoodAt}
            isDarkMode={true}
          />
        </div>
      </div>

      {/* Footer with QR and branding */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end',
        marginTop: 'auto',
        flexShrink: 0,
        paddingTop: '16px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: accentColor, fontStyle: 'italic' }}>
            let's chat
          </span>
          {qrDataUrl && (
            <img src={qrDataUrl} alt="Telegram QR" style={{ width: '120px', height: '120px' }} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: accentColor, marginBottom: '8px', fontStyle: 'italic' }}>
            made on
          </span>
          <img src={arubaitoLogo} alt="Arubaito" style={{ width: '120px', height: 'auto' }} />
        </div>
      </div>
    </div>
  );
};

export default IkigaiCardExport;