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
  type QuadrantType,
} from '@/components/ikigai';
import { downloadIkigaiCard } from '@/utils/ikigaiCardGenerator';
import IkigaiCardExport from '@/components/ikigai/IkigaiCardExport';
import { TextRotator } from '@/components/TextRotator';

// Key to force re-render of export component
let exportKey = 0;

const QUADRANT_EXPLAINERS: Record<NonNullable<QuadrantType>, string> = {
  love: "What reliably gives you energy even when it's hard?",
  paidFor: "Where money already flows, or can realistically be made to flow, without forcing reality.",
  needs: "Unmet demand, misalignment, or inefficiency that should be fixed.",
  goodAt: "Things where your output-to-effort ratio is unusually high. You see it clearer than your peers, others ask for your help on this thing, repeatedly.",
};

const IkigaiCard: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statement, setStatement] = useState('');
  const [exportData, setExportData] = useState<{
    name: string;
    statement: string;
    whatYouLove: string;
    whatWorldNeeds: string;
    whatPaidFor: string;
    whatGoodAt: string;
    telegramHandle: string;
  } | null>(null);
  const [activeQuadrant, setActiveQuadrant] = useState<QuadrantType>(null);
  const [mobileActiveQuadrant, setMobileActiveQuadrant] = useState<QuadrantType>(null);
  const [formData, setFormData] = useState<Partial<IkigaiFormData>>({
    name: '',
    telegramHandle: '',
    whatYouLove: '',
    whatWorldNeeds: '',
    whatPaidFor: '',
    whatGoodAt: '',
  });

  const cardRef = useRef<HTMLDivElement>(null);

  const handleQuadrantHover = (quadrant: QuadrantType) => {
    setActiveQuadrant(quadrant);
  };

  const handleMobileQuadrantClick = (quadrant: QuadrantType) => {
    // Toggle: if clicking the same quadrant, deselect it
    setMobileActiveQuadrant(prev => prev === quadrant ? null : quadrant);
  };

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
        // Capture the data at submission time for export
        exportKey++;
        setExportData({
          name,
          statement: responseData.statement,
          whatYouLove: data.whatYouLove,
          whatWorldNeeds: data.whatWorldNeeds,
          whatPaidFor: data.whatPaidFor,
          whatGoodAt: data.whatGoodAt,
          telegramHandle: data.telegramHandle,
        });
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
      exportKey++;
      setExportData({
        name,
        statement: fallbackStatement,
        whatYouLove: data.whatYouLove,
        whatWorldNeeds: data.whatWorldNeeds,
        whatPaidFor: data.whatPaidFor,
        whatGoodAt: data.whatGoodAt,
        telegramHandle: data.telegramHandle,
      });
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

  const bgColor = isDarkMode ? 'bg-[#181818]' : 'bg-[#ebe9e6]';
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
      <main className="min-h-screen flex flex-col lg:flex-row lg:items-center pt-20 lg:pt-0">
        <div className="container mx-auto px-8 py-8 lg:py-24">
          {/* Mobile: Rotating text at top */}
          <div className="lg:hidden mb-6 text-center" data-export-hide="true">
            {mobileActiveQuadrant ? (
              <p 
                className="text-base text-primary/90 leading-relaxed"
                style={{ fontFamily: 'Consolas, monospace' }}
              >
                {QUADRANT_EXPLAINERS[mobileActiveQuadrant]}
              </p>
            ) : !isSubmitted ? (
              <p 
                className={`text-lg ${isDarkMode ? 'text-cream/60' : 'text-[#181818]/60'}`}
                style={{ fontFamily: 'Consolas, monospace' }}
              >
                <span className="font-bold">discover meaning through your </span>
                <TextRotator
                  words={['ikigai', 'resondetere', 'purpose']}
                  isActive={true}
                  className="text-primary font-bold"
                />
              </p>
            ) : (
              <IkigaiOutput
                statement={statement}
                name={formData.name || ''}
                isDarkMode={isDarkMode}
              />
            )}
          </div>

          {/* Mobile: Diagram first */}
          <div className="lg:hidden w-full mb-8">
            <IkigaiDiagram
              whatYouLove={formData.whatYouLove || ''}
              whatWorldNeeds={formData.whatWorldNeeds || ''}
              whatPaidFor={formData.whatPaidFor || ''}
              whatGoodAt={formData.whatGoodAt || ''}
              isDarkMode={isDarkMode}
              activeQuadrant={mobileActiveQuadrant}
              onQuadrantClick={handleMobileQuadrantClick}
            />
          </div>

          {/* Desktop layout */}
          <div className="hidden lg:flex flex-row items-center gap-8 lg:gap-12">
            {/* Left Column - Form */}
            <div className="w-auto min-w-[280px] flex flex-col justify-center" data-export-hide="true">
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

            {/* Center Column - Diagram (desktop only) */}
            <div className="flex-1 max-w-[600px]">
              <IkigaiDiagram
                whatYouLove={formData.whatYouLove || ''}
                whatWorldNeeds={formData.whatWorldNeeds || ''}
                whatPaidFor={formData.whatPaidFor || ''}
                whatGoodAt={formData.whatGoodAt || ''}
                isDarkMode={isDarkMode}
                activeQuadrant={activeQuadrant}
                onQuadrantHover={handleQuadrantHover}
              />
            </div>

            {/* Right Column - Tagline or Output */}
            <div className="w-auto min-w-[220px] max-w-[280px] flex flex-col justify-center items-start px-6" data-export-hide="true">
              {activeQuadrant ? (
                <p 
                  className="text-base text-primary/90 leading-relaxed"
                  style={{ fontFamily: 'Consolas, monospace' }}
                >
                  {QUADRANT_EXPLAINERS[activeQuadrant]}
                </p>
              ) : !isSubmitted ? (
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
              ) : (
                <div className="w-full">
                  <IkigaiOutput
                    statement={statement}
                    name={formData.name || ''}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Form at bottom */}
          <div className="lg:hidden" data-export-hide="true">
            {!isSubmitted ? (
              <IkigaiForm
                onSubmit={handleSubmit}
                onInputChange={handleInputChange}
                isLoading={isLoading}
                isDarkMode={isDarkMode}
              />
            ) : (
              <div className="space-y-4 text-center">
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
                  className="block mx-auto text-primary hover:text-primary/80"
                  style={{ fontFamily: 'Consolas, monospace' }}
                >
                  Create Another
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Hidden Export Component for Download */}
      {isSubmitted && exportData && (
        <div className="fixed -left-[9999px] -top-[9999px]">
          <IkigaiCardExport
            key={exportKey}
            id="ikigai-card-export"
            name={exportData.name}
            statement={exportData.statement}
            whatYouLove={exportData.whatYouLove}
            whatWorldNeeds={exportData.whatWorldNeeds}
            whatPaidFor={exportData.whatPaidFor}
            whatGoodAt={exportData.whatGoodAt}
            telegramHandle={exportData.telegramHandle}
            isDarkMode={isDarkMode}
          />
        </div>
      )}
    </div>
  );
};

export default IkigaiCard;