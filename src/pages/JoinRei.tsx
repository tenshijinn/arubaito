import { JoinReiHero } from '@/components/joinrei/JoinReiHero';
import { JoinReiValueProp } from '@/components/joinrei/JoinReiValueProp';
import { JoinReiAggregation } from '@/components/joinrei/JoinReiAggregation';
import { JoinReiHowItWorks } from '@/components/joinrei/JoinReiHowItWorks';
import { JoinReiChatDemo } from '@/components/joinrei/JoinReiChatDemo';
import { JoinReiReferral } from '@/components/joinrei/JoinReiReferral';
import { JoinReiPricing } from '@/components/joinrei/JoinReiPricing';

const JoinRei = () => {
  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-background">
      <JoinReiHero />
      <JoinReiValueProp />
      <JoinReiAggregation />
      <JoinReiHowItWorks />
      <JoinReiChatDemo />
      <JoinReiReferral />
      <JoinReiPricing />
    </div>
  );
};

export default JoinRei;
