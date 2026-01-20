import { ScrollFadeIn } from './ScrollFadeIn';
import { Button } from '@/components/ui/button';
import { Eye, Zap, Rocket } from 'lucide-react';
import solanaBadges from '@/assets/joinrei/solana-badges.png';

const pricingTiers = [
  {
    name: 'Posts',
    price: '$5',
    period: 'Per Post',
    icon: Eye,
    premium: false,
  },
  {
    name: 'Unlimited Posts',
    price: '$99',
    period: '30days',
    icon: Zap,
    premium: false,
  },
  {
    name: 'Rocket Reach',
    price: '$2500',
    period: 'Per Post + Ad Campaign',
    icon: Rocket,
    premium: true,
  }
];

export const JoinReiPricing = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-8 lg:px-16">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary text-center font-display mb-16">
            Packages
          </h2>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <ScrollFadeIn key={tier.name} delay={index * 100}>
              <div className={`relative h-full flex flex-col p-8 rounded-3xl border-2 transition-all duration-300 hover:shadow-2xl ${
                tier.premium 
                  ? 'border-amber-500/60 bg-gradient-to-br from-amber-500/15 to-transparent hover:shadow-amber-500/20' 
                  : 'border-primary/40 bg-primary/5 hover:shadow-primary/20'
              }`}>
                
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className={`p-4 rounded-2xl ${
                    tier.premium 
                      ? 'bg-amber-500/20 border border-amber-500/40' 
                      : 'bg-primary/20 border border-primary/40'
                  }`}>
                    <tier.icon className={`h-10 w-10 ${
                      tier.premium ? 'text-amber-500' : 'text-primary'
                    }`} />
                  </div>
                </div>

                {/* Name */}
                <h3 className={`text-xl font-bold font-mono mb-2 text-center ${
                  tier.premium ? 'text-amber-500' : 'text-primary'
                }`}>{tier.name}</h3>

                {/* Price */}
                <div className="text-center mb-2">
                  <span className={`text-4xl font-bold font-mono ${
                    tier.premium ? 'text-amber-500' : 'text-cream'
                  }`}>{tier.price}</span>
                </div>

                {/* Period */}
                <p className="text-cream/60 font-mono text-sm text-center mb-8">{tier.period}</p>

                {/* Payment badges */}
                <div className="flex justify-center mb-6">
                  <img 
                    src={solanaBadges} 
                    alt="Solana Pay & x402" 
                    className="h-8 w-auto object-contain"
                  />
                </div>

                {/* CTA */}
                <Button 
                  className={`w-full font-mono h-12 rounded-full ${
                    tier.premium 
                      ? 'bg-amber-500 text-background hover:bg-amber-500/90' 
                      : 'bg-primary text-background hover:bg-primary/90'
                  }`}
                  onClick={() => window.location.href = '/rei'}
                >
                  Pay
                </Button>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
