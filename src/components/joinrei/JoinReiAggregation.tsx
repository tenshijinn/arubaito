import { ScrollFadeIn } from './ScrollFadeIn';
import { ParallaxWrapper } from './ParallaxWrapper';
import { Eye, ArrowRight, Users } from 'lucide-react';
import solanaIcon from '@/assets/solana-icon.png';

const blockchainIcons = [
  'ETH', 'SOL', 'MATIC', 'BSC', 'AVAX', 'ARB', 'OP', 'BASE',
  'FTM', 'NEAR', 'ATOM', 'DOT', 'ADA', 'ALGO', 'HBAR', 'XTZ'
];

const platforms = ['Galxe', 'Zealy', 'QuestN', 'TaskOn', 'Layer3', 'Crew3'];

export const JoinReiAggregation = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-6 lg:px-12">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-cream text-center leading-tight font-mono mb-4">
            Get Task Talent from{' '}
            <span className="text-primary">Cross-Chains</span>,{' '}
            <span className="text-primary">Cross-Platforms</span>,{' '}
            <span className="text-primary">Cross-Communities</span>
          </h2>
          <p className="text-cream/60 font-mono text-center mb-16 max-w-2xl mx-auto">
            41+ blockchains. All major task platforms. One unified talent pool.
          </p>
        </ScrollFadeIn>

        {/* Aggregation Diagram */}
        <div className="grid lg:grid-cols-5 gap-6 items-center">
          {/* Blockchains */}
          <ScrollFadeIn delay={100} className="lg:col-span-1">
            <div className="p-6 border border-cream/10 rounded-2xl bg-gradient-to-br from-cream/5 to-transparent">
              <h3 className="text-sm font-bold text-cream/50 font-mono mb-4 text-center uppercase tracking-wider">41+ Chains</h3>
              <div className="grid grid-cols-4 gap-2">
                {blockchainIcons.map((chain, i) => (
                  <ParallaxWrapper key={chain} speed={0.05 * (i % 4)}>
                    <div className="aspect-square rounded-lg bg-cream/5 border border-cream/10 flex items-center justify-center hover:border-primary/50 transition-colors cursor-default group">
                      <span className="text-[10px] text-cream/40 font-mono group-hover:text-primary transition-colors">{chain}</span>
                    </div>
                  </ParallaxWrapper>
                ))}
              </div>
            </div>
          </ScrollFadeIn>

          {/* Arrow */}
          <div className="hidden lg:flex justify-center">
            <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
          </div>

          {/* Platforms */}
          <ScrollFadeIn delay={200} className="lg:col-span-1">
            <div className="p-6 border border-cream/10 rounded-2xl bg-gradient-to-br from-cream/5 to-transparent">
              <h3 className="text-sm font-bold text-cream/50 font-mono mb-4 text-center uppercase tracking-wider">Platforms</h3>
              <div className="space-y-2">
                {platforms.map((platform, i) => (
                  <ParallaxWrapper key={platform} speed={0.03 * i}>
                    <div className="px-3 py-2 rounded-lg bg-cream/5 border border-cream/10 text-center hover:border-primary/50 transition-colors">
                      <span className="text-sm text-cream/70 font-mono">{platform}</span>
                    </div>
                  </ParallaxWrapper>
                ))}
              </div>
            </div>
          </ScrollFadeIn>

          {/* Arrow */}
          <div className="hidden lg:flex justify-center">
            <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
          </div>

          {/* Rei Center */}
          <ScrollFadeIn delay={300} className="lg:col-span-1">
            <div className="relative">
              <div className="p-8 border-2 border-primary rounded-2xl bg-gradient-to-br from-primary/20 to-transparent">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                    <Eye className="h-16 w-16 text-primary relative z-10" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-cream font-mono">REI</h3>
                    <p className="text-xs text-cream/50 font-mono">Aggregation Layer</p>
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-2 -right-2 px-2 py-1 bg-primary rounded text-xs text-background font-mono font-bold">
                AI
              </div>
            </div>
          </ScrollFadeIn>
        </div>

        {/* Output: Matched Talent */}
        <ScrollFadeIn delay={400}>
          <div className="mt-12 flex justify-center">
            <div className="flex items-center gap-4">
              <ArrowRight className="h-6 w-6 text-primary rotate-90 lg:rotate-0" />
              <div className="p-6 border border-primary/50 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent">
                <div className="flex items-center gap-4">
                  <Users className="h-10 w-10 text-primary" />
                  <div>
                    <h3 className="text-lg font-bold text-cream font-mono">Matched Talent</h3>
                    <p className="text-sm text-cream/60 font-mono">Skilled contributors matched to your tasks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
