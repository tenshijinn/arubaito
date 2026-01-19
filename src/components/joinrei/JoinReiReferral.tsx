import { ScrollFadeIn } from './ScrollFadeIn';
import { ParallaxWrapper } from './ParallaxWrapper';
import { Share2, Users, Coins, TrendingUp } from 'lucide-react';
import solanaIcon from '@/assets/solana-icon.png';

export const JoinReiReferral = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Content */}
        <div className="space-y-8">
          <ScrollFadeIn>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-cream leading-tight font-mono">
              Users Earn{' '}
              <span className="text-primary inline-flex items-center gap-2">
                <img src={solanaIcon} alt="Solana" className="h-8 w-8 inline" />
                Solana
              </span>{' '}
              for Referring Your Tasks
            </h2>
          </ScrollFadeIn>

          <ScrollFadeIn delay={100}>
            <p className="text-lg text-cream/70 font-mono">
              Our community is incentivized to spread the word about your tasks. 
              Every successful referral means more quality applicants for you.
            </p>
          </ScrollFadeIn>

          <div className="space-y-4">
            <ScrollFadeIn delay={200}>
              <div className="flex items-start gap-4 p-4 border border-cream/10 rounded-xl hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cream font-mono mb-1">Referral Links</h3>
                  <p className="text-cream/60 font-mono text-sm">Users share unique links to your tasks</p>
                </div>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn delay={300}>
              <div className="flex items-start gap-4 p-4 border border-cream/10 rounded-xl hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cream font-mono mb-1">Track Conversions</h3>
                  <p className="text-cream/60 font-mono text-sm">Automatic tracking of clicks and signups</p>
                </div>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn delay={400}>
              <div className="flex items-start gap-4 p-4 border border-cream/10 rounded-xl hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cream font-mono mb-1">SOL Rewards</h3>
                  <p className="text-cream/60 font-mono text-sm">Instant payouts in Solana for successful referrals</p>
                </div>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn delay={500}>
              <div className="flex items-start gap-4 p-4 border border-cream/10 rounded-xl hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cream font-mono mb-1">Viral Growth</h3>
                  <p className="text-cream/60 font-mono text-sm">Your task reaches exponentially more people</p>
                </div>
              </div>
            </ScrollFadeIn>
          </div>
        </div>

        {/* Right: Visual */}
        <ParallaxWrapper speed={0.15} className="hidden lg:block">
          <ScrollFadeIn delay={300}>
            <div className="relative">
              {/* Terminal/Computer visual placeholder */}
              <div className="aspect-[4/3] rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-8 flex items-center justify-center overflow-hidden">
                {/* Fake terminal display */}
                <div className="w-full h-full rounded-lg bg-background/80 border border-cream/10 p-4 font-mono text-sm">
                  <div className="text-primary mb-2">$ rei referral-stats</div>
                  <div className="text-cream/70 space-y-1">
                    <div>Total Referrals: <span className="text-primary">247</span></div>
                    <div>Conversions: <span className="text-primary">89</span></div>
                    <div>SOL Distributed: <span className="text-primary">12.5</span></div>
                    <div className="pt-2 text-cream/50">---</div>
                    <div className="text-xs text-cream/40">[Vintage terminal placeholder]</div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 px-4 py-2 bg-primary rounded-lg shadow-lg shadow-primary/30">
                <div className="flex items-center gap-2">
                  <img src={solanaIcon} alt="SOL" className="h-5 w-5" />
                  <span className="text-background font-mono font-bold">+0.1 SOL</span>
                </div>
              </div>
            </div>
          </ScrollFadeIn>
        </ParallaxWrapper>
      </div>
    </section>
  );
};
