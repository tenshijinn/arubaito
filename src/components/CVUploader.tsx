import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from 'pdfjs-dist';

interface CVUploaderProps {
  onAnalysisComplete: (analysisId: string) => void;
}

export const CVUploader = ({ onAnalysisComplete }: CVUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
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

      // Extract text content from file
      let fileContent = '';
      if (file.type === 'application/pdf') {
        // Configure PDF.js worker using local worker from node_modules
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fileContent += pageText + '\n';
        }
      } else {
        // For text files, DOC, DOCX
        fileContent = await file.text();
      }

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
          body: { 
            fileName: file.name, 
            fileContent,
            walletAddress: walletAddress.trim() || null
          }
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
          wallet_address: walletAddress.trim() || null,
          bluechip_verified: analysisData.bluechip_verified || false,
          bluechip_score: analysisData.bluechip_score || 0,
          bluechip_details: analysisData.bluechip_details || null,
          scoring_details: analysisData.scoring_details || null,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      toast({
        title: "Analysis complete!",
        description: analysisData.bluechip_verified 
          ? "Your CV has been analyzed and Bluechip Talent verified!" 
          : "Your CV has been analyzed successfully.",
      });

      setWalletAddress("");
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
            
            <div className="w-full max-w-md space-y-3 pt-4">
              <div className="space-y-2">
                <Label htmlFor="wallet-address" className="flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4" />
                  Wallet Address (Optional - For Bluechip Talent Verification)
                </Label>
                <Input
                  id="wallet-address"
                  type="text"
                  placeholder="Enter your wallet address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Verify early blockchain activity to showcase Bluechip Talent status
                </p>
              </div>
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
