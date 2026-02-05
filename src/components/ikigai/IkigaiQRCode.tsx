import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface IkigaiQRCodeProps {
  telegramHandle: string;
  name: string;
  whatPaidFor: string;
  whatWorldNeeds: string;
  isDarkMode: boolean;
}

const IkigaiQRCode: React.FC<IkigaiQRCodeProps> = ({ 
  telegramHandle, 
  name,
  whatPaidFor,
  whatWorldNeeds,
  isDarkMode 
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const normalizeTelegramUsername = (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return '';

      const noProtocol = trimmed.replace(/^https?:\/\//i, '');
      const noDomain = noProtocol
        .replace(/^(t\.me|telegram\.me)\//i, '')
        .replace(/^@/, '');

      return noDomain.split(/[/?#]/)[0] || '';
    };

    const generateQR = async () => {
      if (!telegramHandle || !name) return;

      // Ensure we ALWAYS target a specific username (not share-to-saved-messages)
      const handle = normalizeTelegramUsername(telegramHandle);
      if (!handle) return;

      const displayName =
        name?.trim() && name.trim().toLowerCase() !== 'user' ? name.trim() : handle;

      // Create third-person Telegram message (not the first-person card statement)
      const telegramMessage = `Hey ${displayName} — I came across your Ikigai Card and resonated with this:\n\n"I am a ${whatPaidFor} that helps ${whatWorldNeeds}."\n\nWould be great to connect.`;
      
      const encodedMessage = encodeURIComponent(telegramMessage);
      // Use internal redirect page for reliable app scheme + fallback
      const telegramUrl = `https://arubaito.app/ikigai/tg?u=${handle}&m=${encodedMessage}`;

      try {
        const url = await QRCode.toDataURL(telegramUrl, {
          width: 150,
          margin: 1,
          color: {
            dark: 'hsl(358 79% 64%)',
            light: isDarkMode ? 'hsl(0 0% 9%)' : 'hsl(0 0% 100%)',
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQR();
  }, [telegramHandle, name, whatPaidFor, whatWorldNeeds, isDarkMode]);

  if (!qrDataUrl) return null;

  const textColor = isDarkMode ? 'text-white' : 'text-[#181818]';

  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`text-xs uppercase tracking-widest ${textColor} opacity-60`}>
        let's chat
      </span>
      <img 
        src={qrDataUrl} 
        alt="Telegram QR Code" 
        className="w-[150px] h-[150px]"
      />
    </div>
  );
};

export default IkigaiQRCode;
