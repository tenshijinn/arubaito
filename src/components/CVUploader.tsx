import { useState, useCallback } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CVUploaderProps {
  onAnalysisComplete: (analysisId: string) => void;
}

export const CVUploader = ({ onAnalysisComplete }: CVUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = async (file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain'];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, DOCX, or TXT file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload your CV.",
          variant: "destructive",
        });
        return;
      }

      // Read file content
      const fileContent = await file.text();

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('cv-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setIsUploading(false);
      setIsAnalyzing(true);

      // Call edge function to analyze CV
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-cv',
        {
          body: { fileName: file.name, fileContent }
        }
      );

      if (analysisError) throw analysisError;

      // Save analysis results to database
      const { data: savedAnalysis, error: saveError } = await supabase
        .from('cv_analyses')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: fileName,
          overall_score: analysisData.overall_score,
          content_score: analysisData.content_score,
          structure_score: analysisData.structure_score,
          formatting_score: analysisData.formatting_score,
          keywords_score: analysisData.keywords_score,
          experience_score: analysisData.experience_score,
          feedback: analysisData.feedback,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      toast({
        title: "Analysis complete!",
        description: "Your CV has been analyzed successfully.",
      });

      onAnalysisComplete(savedAnalysis.id);
    } catch (error) {
      console.error('Error processing CV:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process CV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const isProcessing = isUploading || isAnalyzing;

  return (
    <Card className="p-8 border-2 border-dashed transition-all duration-300 hover:shadow-lg"
          style={{ 
            borderColor: dragActive ? 'hsl(var(--primary))' : 'hsl(var(--border))',
            background: dragActive ? 'hsl(var(--accent) / 0.05)' : 'transparent'
          }}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center text-center space-y-4"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-16 w-16 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                {isUploading ? "Uploading your CV..." : "Analyzing your CV..."}
              </h3>
              <p className="text-muted-foreground">
                {isAnalyzing && "Our AI is evaluating your CV against professional benchmarks"}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 rounded-full" style={{ background: 'var(--gradient-primary)' }}>
              <Upload className="h-12 w-12 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Upload Your CV</h3>
              <p className="text-muted-foreground max-w-md">
                Drag and drop your CV here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports PDF, DOC, DOCX, TXT (Max 5MB)
              </p>
            </div>
            <label htmlFor="cv-upload">
              <Button asChild size="lg" className="cursor-pointer">
                <span>
                  <FileText className="mr-2 h-5 w-5" />
                  Select File
                </span>
              </Button>
            </label>
            <input
              id="cv-upload"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileInput}
              disabled={isProcessing}
            />
          </>
        )}
      </div>
    </Card>
  );
};
