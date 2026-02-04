import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const TelegramRedirect = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const username = searchParams.get('u');
    const message = searchParams.get('m');

    if (!username) {
      window.location.href = '/meaning';
      return;
    }

    const encodedMessage = message || '';
    
    // Try app scheme first (works when Telegram is installed)
    const appSchemeUrl = `tg://resolve?domain=${username}&text=${encodedMessage}`;
    
    // Fallback universal link
    const universalUrl = `https://t.me/${username}?text=${encodedMessage}`;

    // Attempt to open via app scheme
    window.location.href = appSchemeUrl;

    // After 1000ms, fallback to universal link if app scheme didn't work
    const fallbackTimeout = setTimeout(() => {
      window.location.href = universalUrl;
    }, 1000);

    return () => clearTimeout(fallbackTimeout);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Opening Telegram...</p>
      </div>
    </div>
  );
};

export default TelegramRedirect;
