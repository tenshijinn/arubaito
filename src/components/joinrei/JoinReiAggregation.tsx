import { ScrollFadeIn } from './ScrollFadeIn';
import { ParallaxWrapper } from './ParallaxWrapper';
import aggImg1 from '@/assets/joinrei/agg-img1.png';
import aggImg2 from '@/assets/joinrei/agg-img2.png';
import aggImg3 from '@/assets/joinrei/agg-img3.png';
import aggImg5 from '@/assets/joinrei/agg-img5.png';
import aggImg6 from '@/assets/joinrei/agg-img6.png';
import aggImg7 from '@/assets/joinrei/agg-img7.png';
import aggImg8 from '@/assets/joinrei/agg-img8.png';
import aggImg9 from '@/assets/joinrei/agg-img9.png';
import aggImg10 from '@/assets/joinrei/agg-img10.png';
import aggImg11 from '@/assets/joinrei/agg-img11.png';
import aggImg12 from '@/assets/joinrei/agg-img12.png';
import aggImg13 from '@/assets/joinrei/agg-img13.png';

const blockchainLogos = [aggImg5, aggImg6, aggImg7, aggImg8, aggImg9, aggImg10, aggImg11, aggImg12, aggImg13];
const platformLogos = [aggImg1, aggImg2, aggImg3];

export const JoinReiAggregation = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-16">
      <div className="container mx-auto px-8 lg:px-16">
        {/* Title */}
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary text-center leading-tight font-mono mb-16">
            Get Task Talent from Cross-Chains,<br />
            Cross Platforms, Cross Communities
          </h2>
        </ScrollFadeIn>

        {/* Aggregation Flow Diagram */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-4">
          
          {/* Blockchains Column */}
          <ScrollFadeIn delay={100}>
            <div className="p-6 border-2 border-primary/40 rounded-3xl bg-primary/5 min-w-[200px]">
              <h3 className="text-lg font-bold text-primary font-mono mb-4 text-center">Blockchains</h3>
              <div className="grid grid-cols-3 gap-3">
                {blockchainLogos.map((logo, i) => (
                  <ParallaxWrapper key={i} speed={0.02 * (i % 3)}>
                    <div className="w-12 h-12 rounded-lg bg-cream/5 border border-cream/10 flex items-center justify-center p-2 hover:border-primary/50 transition-colors">
                      <img src={logo} alt="" className="w-full h-full object-contain" />
                    </div>
                  </ParallaxWrapper>
                ))}
              </div>
              <p className="text-sm text-cream/50 font-mono text-center mt-3">41+</p>
            </div>
          </ScrollFadeIn>

          {/* Arrow */}
          <div className="text-primary text-4xl font-mono rotate-90 lg:rotate-0">→</div>

          {/* Project Tasks Column */}
          <ScrollFadeIn delay={200}>
            <div className="p-6 border-2 border-primary/40 rounded-3xl bg-primary/5 min-w-[200px]">
              <h3 className="text-lg font-bold text-primary font-mono mb-4 text-center">Project Tasks</h3>
              <div className="flex flex-col gap-3">
                {platformLogos.map((logo, i) => (
                  <ParallaxWrapper key={i} speed={0.03 * i}>
                    <div className="h-10 rounded-lg bg-cream/5 border border-cream/10 flex items-center justify-center p-2 hover:border-primary/50 transition-colors">
                      <img src={logo} alt="" className="h-full object-contain" />
                    </div>
                  </ParallaxWrapper>
                ))}
              </div>
            </div>
          </ScrollFadeIn>

          {/* Arrow */}
          <div className="text-primary text-4xl font-mono rotate-90 lg:rotate-0">→</div>

          {/* Aggregation Layer - Center (Rei Eye) */}
          <ScrollFadeIn delay={300}>
            <div className="relative">
              <div className="p-8 border-2 border-primary rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full" />
                    <svg className="h-20 w-20 text-primary relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="4" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-primary font-mono">Aggregation Layer</h3>
                  </div>
                </div>
              </div>
            </div>
          </ScrollFadeIn>

          {/* Arrow */}
          <div className="text-primary text-4xl font-mono rotate-90 lg:rotate-0">→</div>

          {/* Talent Column */}
          <ScrollFadeIn delay={400}>
            <div className="p-6 border-2 border-primary/40 rounded-3xl bg-primary/5 min-w-[200px]">
              <h3 className="text-lg font-bold text-primary font-mono mb-4 text-center">Talent</h3>
              <div className="flex flex-col items-center gap-3">
                <div className="flex -space-x-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-cream/20 border-2 border-background flex items-center justify-center">
                      <svg className="h-5 w-5 text-cream/60" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-cream/70 font-mono">Task Matched</p>
              </div>
            </div>
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
};
