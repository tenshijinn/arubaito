import { ScrollFadeIn } from './ScrollFadeIn';
import { ParallaxWrapper } from './ParallaxWrapper';
import { Eye, X, Sparkles, Target } from 'lucide-react';

export const JoinReiValueProp = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: ASCII Art placeholder */}
        <ParallaxWrapper speed={0.1} className="hidden lg:block">
          <ScrollFadeIn>
            <div className="relative">
              <iframe 
                src="/ascii/rei.html" 
                className="w-full h-[500px] border-2 border-primary/30 rounded-lg bg-background"
                title="Rei ASCII Art"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
            </div>
          </ScrollFadeIn>
        </ParallaxWrapper>

        {/* Right: Content */}
        <div className="space-y-10">
          <ScrollFadeIn>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-cream leading-tight font-mono">
              Promote your existing task to a{' '}
              <span className="text-primary">growing audience</span>
            </h2>
          </ScrollFadeIn>

          <div className="space-y-6">
            <ScrollFadeIn delay={100}>
              <div className="flex items-start gap-4 p-4 border border-cream/10 rounded-xl hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cream font-mono mb-1">A One-Stop-Search for users</h3>
                  <p className="text-cream/60 font-mono text-sm">Users find tasks across all platforms in one place</p>
                </div>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn delay={200}>
              <div className="flex items-start gap-4 p-4 border border-cream/10 rounded-xl hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cream font-mono mb-1">A Unified GTM for projects</h3>
                  <p className="text-cream/60 font-mono text-sm">Reach skilled contributors without fragmented campaigns</p>
                </div>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn delay={300}>
              <div className="flex items-start gap-4 p-4 border border-cream/10 rounded-xl hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <X className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cream font-mono mb-1">X Login</h3>
                  <p className="text-cream/60 font-mono text-sm">Seamless authentication with Twitter/X accounts</p>
                </div>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn delay={400}>
              <div className="flex items-start gap-4 p-4 border border-cream/10 rounded-xl hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cream font-mono mb-1">Matches Skills to Tasks</h3>
                  <p className="text-cream/60 font-mono text-sm">AI-powered matching ensures quality over quantity</p>
                </div>
              </div>
            </ScrollFadeIn>
          </div>

          <ScrollFadeIn delay={500}>
            <div className="pt-6 border-t border-cream/10">
              <p className="text-2xl font-bold text-cream font-mono">
                Reduce task <span className="text-primary line-through decoration-2">slop</span>.
              </p>
            </div>
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
};
