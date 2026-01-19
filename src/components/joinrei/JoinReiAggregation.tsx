import { ScrollFadeIn } from './ScrollFadeIn';
import { ParallaxWrapper } from './ParallaxWrapper';
import reiFlowDiagram from '@/assets/joinrei/rei-flow-diagram.png';

export const JoinReiAggregation = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-16">
      <div className="container mx-auto px-8 lg:px-16">
        {/* Title */}
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary text-center leading-tight font-mono mb-12">
            Get Task Talent from Cross-Chains,<br />
            Cross Platforms, Cross Communities
          </h2>
        </ScrollFadeIn>

        {/* Full Flow Diagram Image */}
        <ScrollFadeIn delay={200}>
          <ParallaxWrapper speed={0.05}>
            <div className="flex justify-center">
              <img 
                src={reiFlowDiagram} 
                alt="Rei Aggregation Flow - Blockchains to Project Tasks to Aggregation Layer to Talent" 
                className="w-full max-w-5xl mx-auto object-contain"
              />
            </div>
          </ParallaxWrapper>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
