import { useState, useEffect } from 'react';
import { ScrollFadeIn } from './ScrollFadeIn';
import { Button } from '@/components/ui/button';
import { Eye, User, ChevronRight } from 'lucide-react';

const chatMessages = [
  { role: 'rei', text: 'Yes. A task matching your skills just opened.' },
  { role: 'user', text: 'What is it?' },
  { role: 'rei', text: 'Community activation for a DAO. Short scope. Paid in SOL.' },
  { role: 'user', text: "I'm interested. Tell me more." },
  { role: 'rei', text: 'The task requires Discord moderation experience. 2-week commitment. 0.5 SOL compensation.' },
];

export const JoinReiChatDemo = () => {
  const [visibleMessages, setVisibleMessages] = useState(0);

  useEffect(() => {
    if (visibleMessages < chatMessages.length) {
      const timer = setTimeout(() => {
        setVisibleMessages(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [visibleMessages]);

  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background py-20">
      <div className="container mx-auto px-6 lg:px-12">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-cream text-center leading-tight font-mono mb-4">
            Chat with <span className="text-primary">Rei</span>
          </h2>
          <p className="text-cream/60 font-mono text-center mb-16 max-w-xl mx-auto">
            Natural conversation to find and match tasks
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn delay={200}>
          <div className="max-w-2xl mx-auto">
            {/* Terminal window */}
            <div className="border-2 border-primary/30 rounded-2xl overflow-hidden bg-background shadow-2xl shadow-primary/10">
              {/* Terminal header */}
              <div className="px-4 py-3 bg-cream/5 border-b border-cream/10 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary/50" />
                  <div className="w-3 h-3 rounded-full bg-cream/20" />
                  <div className="w-3 h-3 rounded-full bg-cream/20" />
                </div>
                <span className="text-sm text-cream/50 font-mono ml-4">rei-terminal</span>
              </div>

              {/* Chat messages */}
              <div className="p-6 space-y-4 min-h-[400px]">
                {chatMessages.slice(0, visibleMessages).map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 animate-fade-in ${
                      msg.role === 'user' ? 'justify-end' : ''
                    }`}
                  >
                    {msg.role === 'rei' && (
                      <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                        <Eye className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`px-4 py-3 rounded-xl max-w-[80%] ${
                        msg.role === 'user'
                          ? 'bg-cream/10 border border-cream/20'
                          : 'bg-primary/10 border border-primary/30'
                      }`}
                    >
                      <p className="text-cream font-mono text-sm">{msg.text}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="p-2 rounded-lg bg-cream/10 border border-cream/20">
                        <User className="h-4 w-4 text-cream/70" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {visibleMessages < chatMessages.length && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                      <Eye className="h-4 w-4 text-primary" />
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/30">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div className="px-4 py-3 bg-cream/5 border-t border-cream/10 flex items-center gap-3">
                <div className="flex-1 px-4 py-2 bg-background border border-cream/10 rounded-lg">
                  <span className="text-cream/30 font-mono text-sm">Type a message...</span>
                </div>
                <Button size="sm" className="bg-primary text-background hover:bg-primary/90">
                  Send
                </Button>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <Button 
                size="lg"
                className="bg-primary text-background hover:bg-primary/90 font-mono"
                onClick={() => window.location.href = '/rei'}
              >
                <Eye className="mr-2 h-5 w-5" />
                Post Task
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
