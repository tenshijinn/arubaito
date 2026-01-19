import { ScrollFadeIn } from './ScrollFadeIn';
import { ParallaxWrapper } from './ParallaxWrapper';
import { Share2 } from 'lucide-react';
import referralImg from '@/assets/joinrei/referral-img1.jpg';

export const JoinReiReferral = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-8 lg:px-16 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Content */}
        <div className="space-y-8">
          <ScrollFadeIn>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary leading-tight font-mono">
              Users Earn Solana for Referring Your Tasks
            </h2>
          </ScrollFadeIn>

          <ScrollFadeIn delay={200}>
            <div className="flex items-center gap-6 p-6 border-2 border-primary/40 rounded-3xl bg-primary/5">
              <div className="p-4 rounded-2xl bg-primary/20">
                <Share2 className="h-8 w-8 text-primary" />
              </div>
              <span className="text-2xl text-cream font-mono">Share</span>
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn delay={300}>
            <div className="flex items-center gap-4">
              {/* User avatars */}
              <div className="flex -space-x-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-12 h-12 rounded-full bg-cream/20 border-2 border-background flex items-center justify-center">
                    <svg className="h-6 w-6 text-cream/60" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                ))}
              </div>
              {/* Solana badge */}
              <div className="px-4 py-2 rounded-full bg-primary/20 border border-primary/40">
                <span className="text-lg text-primary font-mono font-bold">SOL</span>
              </div>
            </div>
          </ScrollFadeIn>
        </div>

        {/* Right: Vintage terminal image */}
        <ParallaxWrapper speed={0.15} className="hidden lg:block">
          <ScrollFadeIn delay={300}>
            <div className="relative">
              <img 
                src={referralImg} 
                alt="Vintage terminal" 
                className="w-full max-w-lg mx-auto rounded-2xl border-2 border-primary/30"
              />
            </div>
          </ScrollFadeIn>
        </ParallaxWrapper>
      </div>
    </section>
  );
};
