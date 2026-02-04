import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { IkigaiDiagram } from './index';

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

  // Parse statement for styling
  const parseStatement = () => {
    const parts: { text: string; isAccent: boolean }[] = [];
    
    // Match pattern: "I'm Name! I am a {role} that helps {mission}."
    const pattern = /^(I'm\s+)(\w+)(!?\s*I am a\s*)(.+?)(\s+that helps\s+)(.+?)(\.?)$/i;
    const match = statement.match(pattern);
    
    if (match) {
      parts.push({ text: "I'm ", isAccent: true });
      parts.push({ text: match[2], isAccent: false }); // Name
      parts.push({ text: "! I am a", isAccent: false });
      parts.push({ text: " " + match[4], isAccent: false }); // Role
      parts.push({ text: " that helps", isAccent: true });
      parts.push({ text: " " + match[6], isAccent: false }); // Mission
      parts.push({ text: " to find", isAccent: true });
      parts.push({ text: " ex-bluechip talent.", isAccent: false });
    } else {
      // Simpler fallback
      parts.push({ text: statement, isAccent: false });
    }
    
    return parts;
  };

  return (
    <div
      id={id}
      style={{
        width: '430px',
        height: '932px', // Phone wallpaper aspect ratio (roughly 9:19.5)
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
          textTransform: 'uppercase',
        }}>
          IKIGAI CARD
        </div>
      </div>

      {/* Statement */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        fontSize: '22px',
        lineHeight: '1.4',
        fontStyle: 'italic',
      }}>
        <span style={{ color: accentColor }}>I'm </span>
        <span style={{ color: textColor }}>{name}! I am a</span>
        <br />
        <span style={{ color: textColor }}>{whatPaidFor}</span>
        <span style={{ color: accentColor }}> that helps</span>
        <br />
        <span style={{ color: textColor }}>{whatWorldNeeds}</span>
        <br />
        <span style={{ color: accentColor }}>to find </span>
        <span style={{ color: textColor }}>ex-bluechip</span>
        <br />
        <span style={{ color: textColor }}>talent</span>
        <span style={{ color: accentColor }}>.</span>
      </div>

      {/* Diagram - centered and prominent */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '370px', height: '370px' }}>
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
        marginTop: '20px',
      }}>
        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ 
            fontSize: '12px', 
            color: accentColor,
            fontStyle: 'italic',
          }}>
            let's chat
          </span>
          {qrDataUrl && (
            <img 
              src={qrDataUrl} 
              alt="Telegram QR" 
              style={{ width: '120px', height: '120px' }}
            />
          )}
        </div>

        {/* Arubaito branding */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          padding: '12px 16px',
          border: `1px solid ${accentColor}`,
          borderRadius: '8px',
        }}>
          <span style={{ 
            fontSize: '10px', 
            color: accentColor,
            marginBottom: '8px',
          }}>
            made on
          </span>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            color: accentColor,
          }}>
            <span style={{ fontSize: '24px' }}>✦</span>
            <span style={{ 
              fontSize: '8px', 
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}>
              ARUBAITO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IkigaiCardExport;