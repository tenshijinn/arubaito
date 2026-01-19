import { ScrollFadeIn } from './ScrollFadeIn';
import { ParallaxWrapper } from './ParallaxWrapper';
import valueAscii from '@/assets/joinrei/value-ascii.png';

export const JoinReiValueProp = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-8 lg:px-16 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: ASCII Art Image */}
        <ParallaxWrapper speed={0.1} className="hidden lg:block">
          <ScrollFadeIn>
            <div className="relative">
              <img 
                src={valueAscii} 
                alt="Rei ASCII Art" 
                className="w-full max-w-md mx-auto"
              />
            </div>
          </ScrollFadeIn>
        </ParallaxWrapper>

        {/* Right: Content */}
        <div className="space-y-8">
          <ScrollFadeIn>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary leading-tight font-mono">
              Promote your existing task to a growing audience
            </h2>
          </ScrollFadeIn>

          <div className="space-y-4">
            <ScrollFadeIn delay={100}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <p className="text-xl text-cream font-mono">A One-Stop-Search for users.</p>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn delay={200}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <p className="text-xl text-cream font-mono">A Unified GTM for projects.</p>
              </div>
            </ScrollFadeIn>
          </div>

          <div className="space-y-6 pt-6">
            <ScrollFadeIn delay={300}>
              <div className="flex items-center gap-4 p-5 border-2 border-primary/40 rounded-2xl bg-primary/5">
                <div className="p-3 rounded-xl bg-primary/20">
                  <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-xl text-cream font-mono">Login</span>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn delay={400}>
              <div className="flex items-center gap-4 p-5 border-2 border-primary/40 rounded-2xl bg-primary/5">
                <div className="p-3 rounded-xl bg-primary/20">
                  <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="4"/>
                    <line x1="12" y1="2" x2="12" y2="4"/>
                    <line x1="12" y1="20" x2="12" y2="22"/>
                    <line x1="2" y1="12" x2="4" y2="12"/>
                    <line x1="20" y1="12" x2="22" y2="12"/>
                  </svg>
                </div>
                <span className="text-xl text-cream font-mono">Matches Skills to Tasks</span>
              </div>
            </ScrollFadeIn>
          </div>

          <ScrollFadeIn delay={500}>
            <div className="pt-8">
              <p className="text-3xl md:text-4xl font-bold text-primary font-mono">
                Reduce task slop.
              </p>
            </div>
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
};
