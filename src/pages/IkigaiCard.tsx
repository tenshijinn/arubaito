import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  IkigaiDiagram,
  IkigaiForm,
  IkigaiOutput,
  IkigaiQRCode,
  ThemeToggle,
  type IkigaiFormData,
} from '@/components/ikigai';
import { downloadIkigaiCard } from '@/utils/ikigaiCardGenerator';
import IkigaiCardExport from '@/components/ikigai/IkigaiCardExport';
import { TextRotator } from '@/components/TextRotator';
const IkigaiCard: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statement, setStatement] = useState('');
  const [formData, setFormData] = useState<Partial<IkigaiFormData>>({
    name: '',
    telegramHandle: '',
    whatYouLove: '',
    whatWorldNeeds: '',
    whatPaidFor: '',
    whatGoodAt: '',
  });

  const cardRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof IkigaiFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (data: IkigaiFormData) => {
    setIsLoading(true);
    // Extract name from telegram handle if not explicitly set
    const name = data.name || data.telegramHandle.replace('@', '') || 'User';
    setFormData({ ...data, name });

    try {
      const { data: responseData, error } = await supabase.functions.invoke('generate-ikigai', {
        body: {
          name: name,
          whatYouLove: data.whatYouLove,
          whatWorldNeeds: data.whatWorldNeeds,
          whatPaidFor: data.whatPaidFor,
          whatGoodAt: data.whatGoodAt,
        },
      });

      if (error) {
        throw error;
      }

      if (responseData?.statement) {
        setStatement(responseData.statement);
        setIsSubmitted(true);
        toast.success('Your Ikigai Card is ready!');
      } else if (responseData?.error) {
        throw new Error(responseData.error);
      }
    } catch (error) {
      console.error('Error generating ikigai:', error);
      // Fallback to template-based statement
      const fallbackStatement = `I'm ${name}! I am a ${data.whatPaidFor} that helps ${data.whatWorldNeeds}.`;
      setStatement(fallbackStatement);
      setIsSubmitted(true);
      toast.warning('Generated using fallback template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadIkigaiCard('ikigai-card-export', 'png', `ikigai-${formData.name || 'card'}`);
      toast.success('Downloaded as PNG');
    } catch (error) {
      toast.error('Failed to download card');
    }
  };

  const bgColor = isDarkMode ? 'bg-[#181818]' : 'bg-white';
  const textColor = isDarkMode ? 'text-white' : 'text-[#181818]';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-300`}>
      {/* Header - minimal with just logo and toggle */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-10">
        <div className="flex items-center gap-2">
          <span className="text-primary text-2xl">✦</span>
          <span 
            className="text-lg uppercase tracking-[0.2em] font-bold"
            style={{ fontFamily: 'Consolas, monospace' }}
          >
            IKIGAI
          </span>
        </div>
        <ThemeToggle isDarkMode={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
      </header>

      {/* Main Content */}
      <main className="min-h-screen flex items-center">
        <div className="container mx-auto px-6 py-24">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left Column - Form (centered vertically) */}
            <div className="w-full lg:w-auto lg:min-w-[280px] flex flex-col justify-center" data-export-hide="true">
              {!isSubmitted ? (
                <IkigaiForm
                  onSubmit={handleSubmit}
                  onInputChange={handleInputChange}
                  isLoading={isLoading}
                  isDarkMode={isDarkMode}
                />
              ) : (
                <div className="space-y-4">
                  <Button
                    onClick={handleDownload}
                    className="gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3"
                    style={{ fontFamily: 'Consolas, monospace' }}
                  >
                    <Download className="w-4 h-4" />
                    Download Card
                  </Button>
                  <Button
                    onClick={() => {
                      setIsSubmitted(false);
                      setStatement('');
                      setFormData({
                        name: '',
                        telegramHandle: '',
                        whatYouLove: '',
                        whatWorldNeeds: '',
                        whatPaidFor: '',
                        whatGoodAt: '',
                      });
                    }}
                    variant="ghost"
                    className="block text-primary hover:text-primary/80"
                    style={{ fontFamily: 'Consolas, monospace' }}
                  >
                    Create Another
                  </Button>
                </div>
              )}
            </div>

            {/* Center Column - Diagram */}
            <div className="flex-1 w-full lg:max-w-[600px]">
              <IkigaiDiagram
                whatYouLove={formData.whatYouLove || ''}
                whatWorldNeeds={formData.whatWorldNeeds || ''}
                whatPaidFor={formData.whatPaidFor || ''}
                whatGoodAt={formData.whatGoodAt || ''}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Right Column - Tagline (only before submit) */}
            {!isSubmitted && (
              <div className="w-full lg:w-auto lg:min-w-[200px] flex flex-col justify-center items-center lg:items-start px-4" data-export-hide="true">
                <p 
                  className={`text-lg ${isDarkMode ? 'text-cream/60' : 'text-[#181818]/60'}`}
                  style={{ fontFamily: 'Consolas, monospace' }}
                >
                  <span className="font-bold">discover meaning</span>
                  <br />
                  <span className="font-bold">through your</span>
                  <br />
                  <TextRotator
                    words={['ikigai', 'resondetere', 'purpose']}
                    isActive={true}
                    className="text-primary font-bold"
                  />
                </p>
              </div>
            )}
          </div>

          {/* Bottom - Output Statement (only after submit) */}
          {isSubmitted && (
            <div className="mt-8 text-center max-w-3xl mx-auto">
              <IkigaiOutput
                statement={statement}
                name={formData.name || ''}
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </div>
      </main>

      {/* Hidden Export Component for Download */}
      {isSubmitted && (
        <div className="fixed -left-[9999px] -top-[9999px]">
          <IkigaiCardExport
            id="ikigai-card-export"
            name={formData.name || ''}
            statement={statement}
            whatYouLove={formData.whatYouLove || ''}
            whatWorldNeeds={formData.whatWorldNeeds || ''}
            whatPaidFor={formData.whatPaidFor || ''}
            whatGoodAt={formData.whatGoodAt || ''}
            telegramHandle={formData.telegramHandle || ''}
            isDarkMode={isDarkMode}
          />
        </div>
      )}
    </div>
  );
};

export default IkigaiCard;