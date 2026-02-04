import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface IkigaiQRCodeProps {
  telegramHandle: string;
  statement: string;
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
    const generateQR = async () => {
      if (!telegramHandle || !name) return;

      // Remove @ from handle for URL
      const handle = telegramHandle.startsWith('@') 
        ? telegramHandle.substring(1) 
        : telegramHandle;

      // Create third-person Telegram message (not the first-person card statement)
      const telegramMessage = `Hey ${name} — I came across your Ikigai Card and resonated with this:\n\n"I am a ${whatPaidFor} that helps ${whatWorldNeeds}."\n\nWould be great to connect.`;
      
      const encodedMessage = encodeURIComponent(telegramMessage);
      const telegramUrl = `https://t.me/${handle}?text=${encodedMessage}`;

      try {
        const url = await QRCode.toDataURL(telegramUrl, {
          width: 150,
          margin: 1,
          color: {
            dark: '#ed565a',
            light: isDarkMode ? '#181818' : '#ffffff',
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
      <img 
        src={qrDataUrl} 
        alt="Telegram QR Code" 
        className="w-[150px] h-[150px]"
      />
      <span className={`text-xs uppercase tracking-widest ${textColor} opacity-60`}>
        let's chat
      </span>
    </div>
  );
};

export default IkigaiQRCode;
