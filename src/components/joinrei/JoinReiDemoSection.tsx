import { ScrollFadeIn } from './ScrollFadeIn';

const demos = [
  {
    title: 'PROOF OF HUMANITY/TALENT',
    subtitle: 'Users Share Skills + On-Chain Experience',
    video: '/joinrei/1-demo.mp4',
  },
  {
    title: 'FIND TASKS MATCHED TO SKILLS',
    subtitle: 'Rei matches tasks to their skills.',
    video: '/joinrei/2-demo.mp4',
  },
  {
    title: 'POST TASKS | CHATBOT OR X',
    subtitle: 'Post + Pay from Chatbot or X',
    video: '/joinrei/3-demo.mp4',
  },
];

export const JoinReiDemoSection = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-8 lg:px-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {demos.map((demo, index) => (
            <ScrollFadeIn key={demo.title} delay={index * 150}>
              <div className="flex flex-col items-center text-center">
                {/* Title */}
                <h3 className="text-lg md:text-xl font-bold text-primary font-display mb-2 tracking-wide">
                  {demo.title}
                </h3>
                
                {/* Subtitle */}
                <p className="text-sm md:text-base text-cream/70 font-mono mb-6">
                  {demo.subtitle}
                </p>

                {/* Video Demo */}
                <div className="w-full aspect-[9/16] rounded-xl overflow-hidden border-2 border-primary/30 bg-background">
                  <video
                    src={demo.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
