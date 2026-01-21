import { ScrollFadeIn } from './ScrollFadeIn';
import { ParallaxWrapper } from './ParallaxWrapper';
import multiplatform from '@/assets/joinrei/multiplatform.png';

export const JoinReiValueProp = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center overflow-hidden bg-[#1a1a1a]">
      <div className="container mx-auto px-8 lg:px-16 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Content */}
        <div className="space-y-10 order-2 lg:order-1">
          <ScrollFadeIn>
            <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-bold text-primary leading-[1.2] font-display">
              Multiple Task Platforms, In One Place.
            </h2>
          </ScrollFadeIn>

          <div className="space-y-3">
            <ScrollFadeIn delay={100}>
              <p className="text-xl md:text-2xl lg:text-[1.75rem] font-mono text-cream/90">
                A <span className="text-primary font-display font-bold">One-Stop-Search</span> for users.
              </p>
            </ScrollFadeIn>

            <ScrollFadeIn delay={200}>
              <p className="text-xl md:text-2xl lg:text-[1.75rem] font-mono text-cream/90">
                A <span className="text-primary font-display font-bold">Unified GTM</span> for projects.
              </p>
            </ScrollFadeIn>

            <ScrollFadeIn delay={300}>
              <p className="text-lg md:text-xl font-mono text-cream/70 mt-6">
                Users come to Rei from specific task platforms and become "Task Platform-Agnostic". Skills-based matching exposes your task to users who come from across the entire task ecosystem.
              </p>
            </ScrollFadeIn>
          </div>

          <div className="flex items-center gap-8 pt-4">
            <ScrollFadeIn delay={300}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-transparent">
                  <svg className="h-6 w-6 text-cream" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-lg text-cream/80 font-mono">Login</span>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn delay={400}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-transparent">
                  <svg className="h-6 w-6 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 12l2 2 4-4" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                  </svg>
                </div>
                <span className="text-lg text-cream/80 font-mono">Matches Skills to Tasks</span>
              </div>
            </ScrollFadeIn>
          </div>

        </div>

        {/* Right: Image */}
        <ParallaxWrapper speed={0.1} className="hidden lg:flex order-1 lg:order-2 justify-end">
          <ScrollFadeIn>
            <div className="relative">
              <img 
                src={multiplatform}
                alt="Multiple Platforms - Galxe, Quest N, TaskOn, Zealy"
                className="w-full max-w-lg border-0 outline-none"
                style={{ border: 'none', outline: 'none' }}
              />
            </div>
          </ScrollFadeIn>
        </ParallaxWrapper>
      </div>
    </section>
  );
};
