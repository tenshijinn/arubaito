import { useState, useEffect } from 'react';
import { ScrollFadeIn } from './ScrollFadeIn';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import chatImg1 from '@/assets/joinrei/chat-img1.png';

const chatMessages = [
  { role: 'talent', text: 'Yes. A task matching your skills just opened.' },
  { role: 'rei', text: 'Community activation for a DAO. Short scope. Paid in SOL.' },
  { role: 'talent', text: 'What is it?' },
  { role: 'talent', text: 'Community activation for a DAO. Short scope. Paid in SOL.' },
];

export const JoinReiChatDemo = () => {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (isInView && visibleMessages < chatMessages.length) {
      const timer = setTimeout(() => {
        setVisibleMessages(prev => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [visibleMessages, isInView]);

  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-8 lg:px-16">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary text-center font-display mb-4">
            How it works
          </h2>
        </ScrollFadeIn>

        <ScrollFadeIn delay={200}>
          <div 
            className="max-w-3xl mx-auto mt-12"
            ref={(el) => {
              if (el) {
                const observer = new IntersectionObserver(([entry]) => {
                  if (entry.isIntersecting) setIsInView(true);
                }, { threshold: 0.3 });
                observer.observe(el);
              }
            }}
          >
            {/* Terminal-style chat */}
            <div className="border-2 border-primary/40 rounded-3xl overflow-hidden bg-background">
              {/* Chat messages area */}
              <div className="p-8 space-y-6 min-h-[400px]">
                {chatMessages.slice(0, visibleMessages).map((msg, index) => (
                  <div
                    key={index}
                    className="animate-fade-in"
                  >
                    <div className="flex items-start gap-4">
                      {/* Label */}
                      <div className={`px-3 py-1 rounded-full text-sm font-mono font-bold shrink-0 ${
                        msg.role === 'rei' 
                          ? 'bg-primary text-background' 
                          : 'bg-cream/20 text-cream'
                      }`}>
                        {msg.role === 'rei' ? 'Rei' : 'Talent'}
                      </div>
                      {/* Message */}
                      <p className="text-cream font-mono text-lg pt-0.5">{msg.text}</p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isInView && visibleMessages < chatMessages.length && (
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 rounded-full text-sm font-mono font-bold bg-cream/20 text-cream">
                      {chatMessages[visibleMessages].role === 'rei' ? 'Rei' : 'Talent'}
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Post Task CTA */}
            <div className="mt-8 flex justify-center">
              <Button 
                size="lg"
                className="bg-primary text-background hover:bg-primary/90 font-mono text-lg px-8 h-14 rounded-full gap-3"
                onClick={() => window.location.href = '/rei'}
              >
                <Eye className="h-6 w-6" />
                Post Task
              </Button>
            </div>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
