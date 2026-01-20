import { ScrollFadeIn } from './ScrollFadeIn';
import solanaBadges from '@/assets/joinrei/solana-badges.png';
import hiwImg1 from '@/assets/joinrei/hiw-img1.png';
import hiwImg2 from '@/assets/joinrei/hiw-img2.png';
import hiwImg3 from '@/assets/joinrei/hiw-img3.png';

const steps = [
  {
    title: 'Signup',
    icon: hiwImg1,
  },
  {
    title: 'Post Task',
    icon: hiwImg2,
  },
  {
    title: 'Pay SOL',
    icon: hiwImg3,
    showBadges: true,
  }
];

export const JoinReiHowItWorks = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-8 lg:px-16">
        <ScrollFadeIn>
          <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-bold text-primary text-center font-display mb-16">
            How it works
          </h2>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <ScrollFadeIn key={step.title} delay={index * 150}>
              <div className="relative text-center flex flex-col items-center">
                <div className="p-8 border-2 border-primary/40 rounded-3xl bg-primary/5 hover:bg-primary/10 transition-colors w-full">
                  {/* Icon - bigger, centered */}
                  <div className="flex justify-center mb-4">
                    <img src={step.icon} alt={step.title} className="h-24 w-auto object-contain" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-cream font-mono">{step.title}</h3>
                </div>

                {/* Solana badges - below Pay SOL box, centered */}
                {step.showBadges && (
                  <div className="mt-6 flex justify-center">
                    <img 
                      src={solanaBadges} 
                      alt="Solana Pay & x402" 
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                )}
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
