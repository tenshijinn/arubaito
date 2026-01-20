import { ScrollFadeIn } from './ScrollFadeIn';
import solanaBadges from '@/assets/joinrei/solana-badges.png';
import hiwImg1 from '@/assets/joinrei/hiw-img1.png';
import hiwImg2 from '@/assets/joinrei/hiw-img2.png';
import hiwImg3 from '@/assets/joinrei/hiw-img3.png';

const steps = [
  {
    number: '1',
    title: 'Signup',
    icon: hiwImg1,
  },
  {
    number: '2',
    title: 'Post Task',
    icon: hiwImg2,
  },
  {
    number: '3',
    title: 'Pay SOL',
    icon: hiwImg3,
  }
];

export const JoinReiHowItWorks = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-8 lg:px-16">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary text-center font-display mb-16">
            How it works
          </h2>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <ScrollFadeIn key={step.title} delay={index * 150}>
              <div className="relative text-center">
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/3 left-[60%] w-[80%] h-px border-t-2 border-dashed border-primary/30" />
                )}
                
                <div className="p-8 border-2 border-primary/40 rounded-3xl bg-primary/5 hover:bg-primary/10 transition-colors">
                  {/* Step number */}
                  <div className="text-5xl font-bold text-primary font-mono mb-6">{step.number}</div>

                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <img src={step.icon} alt={step.title} className="h-16 w-auto object-contain" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-cream font-mono">{step.title}</h3>
                </div>
              </div>
            </ScrollFadeIn>
          ))}
        </div>

        {/* Payment badges */}
        <ScrollFadeIn delay={500}>
          <div className="mt-12 flex justify-center">
            <img 
              src={solanaBadges} 
              alt="Solana Pay & x402" 
              className="h-12 w-auto object-contain"
            />
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
