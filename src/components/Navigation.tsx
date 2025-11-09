import { Link } from 'react-router-dom';

interface NavigationProps {
  userName?: string | null;
  hideMenuItems?: boolean;
  brandingText?: string;
}

export const Navigation = ({ userName, hideMenuItems = false, brandingText = 'ARUBAITO' }: NavigationProps) => {
  return (
    <header className="border border-border bg-transparent m-2.5 rounded-2xl">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side: User name */}
          <span className="text-sm font-mono text-foreground">
            {userName || 'GUEST'}
          </span>
          
          {/* Center: Menu items */}
          {!hideMenuItems && (
            <nav className="flex items-center gap-6">
              <Link
                to="/club"
                className="text-sm font-mono transition-colors"
                style={{
                  color: '#ed565a'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ed565a';
                  e.currentTarget.style.color = '#181818';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#ed565a';
                }}
              >
                CLUB
              </Link>
              <Link
                to="/arubaito"
                className="text-sm font-mono transition-colors"
                style={{
                  color: '#ed565a'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ed565a';
                  e.currentTarget.style.color = '#181818';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#ed565a';
                }}
              >
                CV PROFILE
              </Link>
              <Link
                to="/rei"
                className="text-sm font-mono transition-colors"
                style={{
                  color: '#ed565a'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ed565a';
                  e.currentTarget.style.color = '#181818';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#ed565a';
                }}
              >
                @ASKREI
              </Link>
              <Link
                to="/community"
                className="text-sm font-mono transition-colors"
                style={{
                  color: '#ed565a'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ed565a';
                  e.currentTarget.style.color = '#181818';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#ed565a';
                }}
              >
                COMMUNITY
              </Link>
            </nav>
          )}

          {/* Right side: Logo */}
          <div className="text-sm font-mono font-bold text-foreground">
            {brandingText}
          </div>
        </div>
      </div>
    </header>
  );
};
