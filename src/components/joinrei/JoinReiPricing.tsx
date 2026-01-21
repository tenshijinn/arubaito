import { ScrollFadeIn } from './ScrollFadeIn';
import { Button } from '@/components/ui/button';
import { Eye, Zap, Rocket, Check } from 'lucide-react';
import solanaBadges from '@/assets/joinrei/solana-badges.png';

const pricingTiers = [
  {
    name: 'Posts',
    price: '$5',
    period: 'Per Post',
    icon: Eye,
    premium: false,
    showSolanaBadges: true,
    bookCall: false,
    positioning: 'One-off task amplification to relevant Web3 contributors.',
    totalValue: '~$685',
    usps: [
      { feature: 'Skill-matched contributors (wallet + declared skills)', worth: '$120' },
      { feature: 'Cross-platform task discovery', worth: '$90' },
      { feature: 'Visibility to contributors on Galxe, Zealy, QuestN, TaskOn, Layer3', worth: '$150' },
      { feature: 'Discovery beyond your own community', worth: '$75' },
      { feature: 'Cross-chain reach (Solana, Ethereum, Polygon, Arbitrum, Base)', worth: '$100' },
      { feature: 'AI-filtered relevance', worth: '$60' },
      { feature: 'No contributor onboarding required', worth: '$40' },
      { feature: 'Traffic routed back to original task platform', worth: '$50' },
    ],
  },
  {
    name: 'Unlimited Posts',
    price: '$99',
    period: '30 days',
    icon: Zap,
    premium: false,
    showSolanaBadges: false,
    bookCall: true,
    positioning: 'Always-on distribution for teams running continuous tasks.',
    totalValue: '~$2,010',
    accentColor: undefined,
    usps: [
      { feature: 'Unlimited task amplification', worth: '$400' },
      { feature: 'API-based ingestion (no manual posting)', worth: '$250' },
      { feature: 'Skill-matched contributors (wallet + declared skills)', worth: '$180' },
      { feature: 'Ongoing visibility on Galxe, Zealy, QuestN, TaskOn, Layer3', worth: '$300' },
      { feature: 'Extended cross-chain reach', worth: '$200' },
      { feature: 'Continuous cross-community discovery', worth: '$150' },
      { feature: 'Reduced contributor overlap', worth: '$120' },
      { feature: 'Priority task freshness', worth: '$100' },
      { feature: 'Basic task performance insights', worth: '$90' },
      { feature: 'Lower effective cost per task', worth: '$120' },
    ],
  },
  {
    name: 'Rocket Reach',
    price: '$2,500',
    period: 'Per Campaign',
    icon: Rocket,
    premium: true,
    showSolanaBadges: false,
    bookCall: true,
    positioning: 'Paid amplification for launches, campaigns, and time-sensitive pushes.',
    totalValue: '~$4,900',
    usps: [
      { feature: 'Guaranteed paid reach (defined wallet/contributor impressions)', worth: '$2,000' },
      { feature: 'Promoted placement across Rei discovery surfaces', worth: '$800' },
      { feature: 'Skill-matched contributors (wallet + declared skills)', worth: '$300' },
      { feature: 'Visibility on Galxe, Zealy, QuestN, TaskOn, Layer3', worth: '$600' },
      { feature: 'Expanded cross-chain reach', worth: '$400' },
      { feature: 'Time-boxed amplification (ideal for launches)', worth: '$250' },
      { feature: 'Campaign-level reporting', worth: '$200' },
      { feature: 'Optional message framing support', worth: '$150' },
      { feature: 'Priority routing during campaign window', worth: '$200' },
    ],
  }
];

const getTierColors = (tier: typeof pricingTiers[0]) => {
  if (tier.premium) {
    return {
      border: 'border-amber-500/60',
      bg: 'bg-gradient-to-br from-amber-500/15 to-transparent',
      shadow: 'hover:shadow-amber-500/20',
      iconBg: 'bg-amber-500/20 border-amber-500/40',
      iconColor: 'text-amber-500',
      textColor: 'text-amber-500',
      buttonBg: 'bg-amber-500 hover:bg-amber-500/90',
      worthBg: 'bg-amber-500/10',
      worthText: 'text-amber-400',
    };
  }
  if (tier.accentColor === 'teal') {
    return {
      border: 'border-teal-500/60',
      bg: 'bg-gradient-to-br from-teal-500/15 to-transparent',
      shadow: 'hover:shadow-teal-500/20',
      iconBg: 'bg-teal-500/20 border-teal-500/40',
      iconColor: 'text-teal-500',
      textColor: 'text-teal-500',
      buttonBg: 'bg-teal-500 hover:bg-teal-500/90',
      worthBg: 'bg-teal-500/10',
      worthText: 'text-teal-400',
    };
  }
  return {
    border: 'border-primary/40',
    bg: 'bg-primary/5',
    shadow: 'hover:shadow-primary/20',
    iconBg: 'bg-primary/20 border-primary/40',
    iconColor: 'text-primary',
    textColor: 'text-primary',
    buttonBg: 'bg-primary hover:bg-primary/90',
    worthBg: 'bg-primary/10',
    worthText: 'text-primary',
  };
};

export const JoinReiPricing = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary text-center font-display mb-12">
            Packages
          </h2>
        </ScrollFadeIn>

        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {pricingTiers.map((tier, index) => {
            const colors = getTierColors(tier);
            return (
              <ScrollFadeIn key={tier.name} delay={index * 100}>
                <div className={`relative h-full flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 hover:shadow-2xl ${colors.border} ${colors.bg} ${colors.shadow}`}>
                  
                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-2xl border ${colors.iconBg}`}>
                      <tier.icon className={`h-8 w-8 ${colors.iconColor}`} />
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className={`text-xl font-bold font-mono mb-1 text-center ${colors.textColor}`}>
                    {tier.name}
                  </h3>

                  {/* Price */}
                  <div className="text-center mb-1">
                    <span className={`text-3xl font-bold font-mono ${tier.premium ? 'text-amber-500' : tier.accentColor === 'teal' ? 'text-teal-500' : 'text-cream'}`}>
                      {tier.price}
                    </span>
                  </div>

                  {/* Period */}
                  <p className="text-cream/60 font-mono text-sm text-center mb-3">{tier.period}</p>

                  {/* Positioning */}
                  <p className="text-cream/80 text-sm text-center mb-4 font-mono leading-relaxed">
                    {tier.positioning}
                  </p>

                  {/* Payment badges - only show for tiers with showSolanaBadges */}
                  {tier.showSolanaBadges && (
                    <div className="flex justify-center mb-4">
                      <img 
                        src={solanaBadges} 
                        alt="Solana Pay & x402" 
                        className="h-7 w-auto object-contain"
                      />
                    </div>
                  )}

                  {/* USPs List */}
                  <div className="flex-1 mb-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                      {tier.usps.map((usp, uspIndex) => (
                        <div key={uspIndex} className="flex items-start gap-2">
                          <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${colors.iconColor}`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-cream/90 text-xs font-mono leading-tight block">
                              {usp.feature}
                            </span>
                            <span className={`text-xs font-mono ${colors.worthText}`}>
                              Worth {usp.worth}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Value */}
                  <div className={`rounded-xl p-3 mb-4 ${colors.worthBg}`}>
                    <p className="text-center font-mono">
                      <span className="text-cream/60 text-xs">Total Value: </span>
                      <span className={`text-lg font-bold ${colors.textColor}`}>{tier.totalValue}</span>
                    </p>
                  </div>

                  {/* CTA */}
                  <Button 
                    className={`w-full font-mono h-11 rounded-full text-background ${colors.buttonBg}`}
                    onClick={() => {
                      if (tier.bookCall) {
                        window.open('https://calendly.com/wayneanthonyd-thepipegdao/join-rei', '_blank');
                      } else {
                        window.location.href = '/rei';
                      }
                    }}
                  >
                    {tier.bookCall ? 'Book a Call' : 'Get Started'}
                  </Button>
                </div>
              </ScrollFadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
};
