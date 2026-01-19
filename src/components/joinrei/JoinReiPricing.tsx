import { ScrollFadeIn } from './ScrollFadeIn';
import { Button } from '@/components/ui/button';
import { Eye, Zap, Rocket, Check } from 'lucide-react';
import solanaIcon from '@/assets/solana-icon.png';

const pricingTiers = [
  {
    name: 'Posts',
    price: '$5',
    period: 'per post',
    description: 'Perfect for one-off tasks and testing the platform',
    features: [
      'Single task posting',
      'AI skill matching',
      'Basic analytics',
      'Solana Pay + x402'
    ],
    icon: Eye,
    popular: false,
    cta: 'Post Task'
  },
  {
    name: 'Unlimited Posts',
    price: '$99',
    period: '/ 30 days',
    description: 'For teams with ongoing hiring and task needs',
    features: [
      'Unlimited task postings',
      'Priority matching',
      'Advanced analytics',
      'Dedicated support',
      'Team collaboration'
    ],
    icon: Zap,
    popular: true,
    cta: 'Get Unlimited'
  },
  {
    name: 'Rocket Reach',
    price: '$2,500',
    period: 'per campaign',
    description: 'Premium placement with targeted ad campaign',
    features: [
      'Featured task placement',
      'Social media promotion',
      'Influencer outreach',
      'Custom targeting',
      'White-glove service',
      'Guaranteed reach'
    ],
    icon: Rocket,
    popular: false,
    premium: true,
    cta: 'Contact Sales'
  }
];

export const JoinReiPricing = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-6 lg:px-12">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-cream text-center leading-tight font-mono mb-4">
            Simple <span className="text-primary">Pricing</span>
          </h2>
          <p className="text-cream/60 font-mono text-center mb-16 max-w-xl mx-auto">
            Pay only for what you need. No hidden fees.
          </p>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <ScrollFadeIn key={tier.name} delay={index * 100}>
              <div className={`relative h-full flex flex-col p-8 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
                tier.premium 
                  ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent hover:shadow-amber-500/20' 
                  : tier.popular 
                    ? 'border-primary bg-gradient-to-br from-primary/10 to-transparent hover:shadow-primary/20'
                    : 'border-cream/10 bg-gradient-to-br from-cream/5 to-transparent hover:border-cream/30'
              }`}>
                {/* Popular badge */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-background text-xs font-mono font-bold rounded-full">
                    POPULAR
                  </div>
                )}

                {/* Premium badge */}
                {tier.premium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-background text-xs font-mono font-bold rounded-full">
                    PREMIUM
                  </div>
                )}

                {/* Icon */}
                <div className={`p-4 rounded-xl w-fit mb-6 ${
                  tier.premium 
                    ? 'bg-amber-500/20 border border-amber-500/30' 
                    : tier.popular 
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-cream/10 border border-cream/20'
                }`}>
                  <tier.icon className={`h-8 w-8 ${
                    tier.premium ? 'text-amber-500' : tier.popular ? 'text-primary' : 'text-cream'
                  }`} />
                </div>

                {/* Name & Price */}
                <h3 className="text-xl font-bold text-cream font-mono mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className={`text-4xl font-bold font-mono ${
                    tier.premium ? 'text-amber-500' : 'text-cream'
                  }`}>{tier.price}</span>
                  <span className="text-cream/50 font-mono text-sm">{tier.period}</span>
                </div>

                <p className="text-cream/60 font-mono text-sm mb-6">{tier.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 shrink-0 ${
                        tier.premium ? 'text-amber-500' : 'text-primary'
                      }`} />
                      <span className="text-cream/70 font-mono text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Payment badges */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-cream/5 rounded">
                    <img src={solanaIcon} alt="Solana Pay" className="h-3 w-3" />
                    <span className="text-xs text-cream/50 font-mono">Solana Pay</span>
                  </div>
                  <div className="px-2 py-1 bg-cream/5 rounded">
                    <span className="text-xs text-cream/50 font-mono">x402</span>
                  </div>
                </div>

                {/* CTA */}
                <Button 
                  className={`w-full font-mono ${
                    tier.premium 
                      ? 'bg-amber-500 text-background hover:bg-amber-500/90' 
                      : tier.popular 
                        ? 'bg-primary text-background hover:bg-primary/90'
                        : 'bg-cream/10 text-cream hover:bg-cream/20 border border-cream/20'
                  }`}
                  onClick={() => window.location.href = '/rei'}
                >
                  {tier.cta}
                </Button>
              </div>
            </ScrollFadeIn>
          ))}
        </div>

        {/* Footer note */}
        <ScrollFadeIn delay={400}>
          <p className="text-center text-cream/40 font-mono text-sm mt-12">
            All prices in USD equivalent. Paid in SOL via Solana Pay or x402 protocol.
          </p>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
