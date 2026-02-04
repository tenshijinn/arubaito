import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
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
    setFormData(data);

    try {
      const { data: responseData, error } = await supabase.functions.invoke('generate-ikigai', {
        body: {
          name: data.name,
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
      const fallbackStatement = `I'm ${data.name}! I am a ${data.whatPaidFor} that helps ${data.whatWorldNeeds}.`;
      setStatement(fallbackStatement);
      setIsSubmitted(true);
      toast.warning('Generated using fallback template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (format: 'png' | 'pdf') => {
    try {
      await downloadIkigaiCard('ikigai-card-export', format, `ikigai-${formData.name || 'card'}`);
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to download card');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const bgColor = isDarkMode ? 'bg-[#181818]' : 'bg-white';
  const textColor = isDarkMode ? 'text-white' : 'text-[#181818]';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-300`}>
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-current/10">
        <Link 
          to="/" 
          className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">Back</span>
        </Link>
        <h1 className="text-sm uppercase tracking-[0.3em] font-bold">Ikigai Card</h1>
        <ThemeToggle isDarkMode={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Form */}
          <div data-export-hide="true" className={isSubmitted ? 'lg:order-2' : ''}>
            {!isSubmitted ? (
              <div className="max-w-md">
                <h2 className="text-2xl font-bold mb-2">Find Your Purpose</h2>
                <p className={`text-sm mb-8 ${isDarkMode ? 'text-white/60' : 'text-[#181818]/60'}`}>
                  Answer these questions to generate your personal Ikigai Card — a shareable artifact of your identity.
                </p>
                <IkigaiForm
                  onSubmit={handleSubmit}
                  onInputChange={handleInputChange}
                  isLoading={isLoading}
                  isDarkMode={isDarkMode}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-bold mb-4">Your Card is Ready!</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleDownload('png')}
                    variant="outline"
                    className={`gap-2 ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-[#181818]/20'}`}
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </Button>
                  <Button
                    onClick={() => handleDownload('pdf')}
                    variant="outline"
                    className={`gap-2 ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-[#181818]/20'}`}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className={`gap-2 ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-[#181818]/20'}`}
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setStatement('');
                  }}
                  variant="ghost"
                  className="text-primary hover:text-primary/80"
                >
                  Create Another
                </Button>
              </div>
            )}
          </div>

          {/* Right Column - Diagram & Output */}
          <div 
            id="ikigai-card-export" 
            ref={cardRef}
            className={`${bgColor} ${textColor} p-8 rounded-lg ${isSubmitted ? 'lg:order-1' : ''}`}
          >
            <div className="flex flex-col items-center">
              {/* Diagram */}
              <div className="w-full max-w-[400px] aspect-square">
                <IkigaiDiagram
                  whatYouLove={formData.whatYouLove || ''}
                  whatWorldNeeds={formData.whatWorldNeeds || ''}
                  whatPaidFor={formData.whatPaidFor || ''}
                  whatGoodAt={formData.whatGoodAt || ''}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Output Statement */}
              {isSubmitted && (
                <IkigaiOutput
                  statement={statement}
                  name={formData.name || ''}
                  isDarkMode={isDarkMode}
                />
              )}

              {/* QR Code */}
              {isSubmitted && formData.telegramHandle && (
                <div className="mt-8">
                  <IkigaiQRCode
                    telegramHandle={formData.telegramHandle}
                    statement={statement}
                    name={formData.name || ''}
                    whatPaidFor={formData.whatPaidFor || ''}
                    whatWorldNeeds={formData.whatWorldNeeds || ''}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}

              {/* Branding */}
              {isSubmitted && (
                <div className={`mt-8 pt-6 border-t border-current/10 w-full text-center`}>
                  <span className="text-xs uppercase tracking-widest opacity-40">
                    Powered by Arubaito
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IkigaiCard;
