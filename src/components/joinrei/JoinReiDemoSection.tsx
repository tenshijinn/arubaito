import { ScrollFadeIn } from './ScrollFadeIn';

const demos = [
  {
    title: 'PROOF OF HUMANITY/TALENT',
    subtitle: 'Users Share Skills + On-Chain Experience',
    video: '/joinrei/1-rei-video.mp4',
  },
  {
    title: 'FIND TASKS MATCHED TO SKILLS',
    subtitle: 'Rei matches tasks to their skills.',
    video: '/joinrei/2-rei-video.mp4',
  },
  {
    title: 'POST TASKS | CHATBOT OR X',
    subtitle: 'Post + Pay from Chatbot or X',
    video: '/joinrei/3-rei-video.mp4',
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
                <h3 className="text-xs md:text-sm font-bold text-primary font-display mb-1 tracking-wide whitespace-nowrap">
                  {demo.title}
                </h3>
                
                {/* Subtitle */}
                <p className="text-xs text-cream/70 font-mono mb-4 whitespace-nowrap">
                  {demo.subtitle}
                </p>

                {/* Video Demo */}
                <div className="w-full aspect-[9/19] rounded-lg overflow-hidden border border-primary/40 bg-black">
                  <video
                    src={demo.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover object-top"
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
