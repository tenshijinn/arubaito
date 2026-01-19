import { ScrollFadeIn } from './ScrollFadeIn';
import { Eye, Ghost, Coins } from 'lucide-react';
import solanaIcon from '@/assets/solana-icon.png';

const steps = [
  {
    icon: Ghost,
    title: 'Signup',
    description: 'Connect with X/Twitter or Phantom wallet',
    step: '01'
  },
  {
    icon: Eye,
    title: 'Post Task',
    description: 'Describe your task and requirements to Rei',
    step: '02'
  },
  {
    icon: Coins,
    title: 'Pay SOL',
    description: 'Simple payment via Solana Pay or x402',
    step: '03'
  }
];

export const JoinReiHowItWorks = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-6 lg:px-12">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-cream text-center leading-tight font-mono mb-4">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-cream/60 font-mono text-center mb-16 max-w-xl mx-auto">
            Three simple steps to reach skilled task workers
          </p>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <ScrollFadeIn key={step.title} delay={index * 150}>
              <div className="group relative">
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 left-full w-full h-px bg-gradient-to-r from-primary/50 to-transparent -translate-y-1/2 z-0" />
                )}
                
                <div className="relative p-8 border-2 border-cream/10 rounded-2xl bg-gradient-to-br from-cream/5 to-transparent hover:border-primary/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/10">
                  {/* Step number */}
                  <div className="absolute -top-3 -left-3 px-3 py-1 bg-primary text-background font-mono font-bold text-sm rounded">
                    {step.step}
                  </div>

                  <div className="flex flex-col items-center text-center gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 relative z-10">
                        <step.icon className="h-10 w-10 text-primary" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-cream font-mono mb-2">{step.title}</h3>
                      <p className="text-cream/60 font-mono text-sm">{step.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollFadeIn>
          ))}
        </div>

        {/* Payment methods */}
        <ScrollFadeIn delay={500}>
          <div className="mt-16 flex justify-center">
            <div className="flex items-center gap-6 px-6 py-4 border border-cream/10 rounded-full bg-cream/5">
              <span className="text-sm text-cream/50 font-mono uppercase tracking-wider">Accepted Payments:</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-cream/10 rounded-full">
                  <img src={solanaIcon} alt="Solana Pay" className="h-4 w-4" />
                  <span className="text-sm text-cream font-mono">Solana Pay</span>
                </div>
                <div className="px-3 py-1.5 bg-cream/10 rounded-full">
                  <span className="text-sm text-cream font-mono">x402</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
