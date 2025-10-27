import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";

interface WorkExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
  projects: string;
}

interface ManualCVFormProps {
  onBack: () => void;
  onComplete: (analysisId: string) => void;
  walletAddress?: string;
}

export const ManualCVForm = ({ onBack, onComplete, walletAddress }: ManualCVFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [experiences, setExperiences] = useState<WorkExperience[]>([
    { id: '1', company: '', role: '', period: '', description: '', projects: '' }
  ]);

  const addExperience = () => {
    setExperiences([
      ...experiences,
      { id: Date.now().toString(), company: '', role: '', period: '', description: '', projects: '' }
    ]);
  };

  const removeExperience = (id: string) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter(exp => exp.id !== id));
    }
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: string) => {
    setExperiences(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!fullName || !email || !summary || !skills) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

    if (experiences.some(exp => !exp.company || !exp.role)) {
      toast({
        title: "Incomplete Experience",
        description: "Please complete all work experience entries or remove empty ones",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Build CV content from form data
      const cvContent = `
FULL NAME: ${fullName}
EMAIL: ${email}

PROFESSIONAL SUMMARY:
${summary}

SKILLS:
${skills}

WORK EXPERIENCE:
${experiences.map(exp => `
Company: ${exp.company}
Role: ${exp.role}
Period: ${exp.period}
Description: ${exp.description}
${exp.projects ? `Projects/Protocols Worked On: ${exp.projects}` : ''}
`).join('\n')}
`;

      // Call edge function to analyze
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-cv',
        {
          body: { 
            fileName: `${fullName.replace(/\s+/g, '_')}_manual_cv.txt`,
            fileContent: cvContent,
            walletAddress: walletAddress || null
          }
        }
      );

      if (analysisError) throw analysisError;

      // Save to database
      const { data: savedAnalysis, error: saveError } = await supabase
        .from('cv_analyses')
        .insert({
          user_id: user.id,
          file_name: `${fullName}_Manual_CV`,
          file_path: 'manual_submission',
          overall_score: analysisData.overall_score,
          content_score: analysisData.content_score,
          structure_score: analysisData.structure_score,
          formatting_score: analysisData.formatting_score,
          keywords_score: analysisData.keywords_score,
          experience_score: analysisData.experience_score,
          feedback: analysisData.feedback,
          wallet_address: walletAddress || null,
          bluechip_verified: analysisData.bluechip_verified || false,
          bluechip_score: analysisData.bluechip_score || 0,
          bluechip_details: analysisData.bluechip_details || null,
          scoring_details: analysisData.scoring_details || null,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      toast({
        title: "Profile Created!",
        description: analysisData.bluechip_verified 
          ? "Your CV profile has been created and Bluechip verified!" 
          : "Your CV profile has been created successfully.",
      });

      onComplete(savedAnalysis.id);
    } catch (error) {
      console.error('Error submitting manual CV:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Manual CV Profile Form</h2>
      </div>

      {walletAddress && (
        <Card className="p-4 bg-accent/30">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground">Connected Wallet:</span>
          </div>
          <p className="mt-2 text-xs font-mono text-muted-foreground break-all">
            {walletAddress}
          </p>
          <p className="mt-2 text-xs" style={{ color: 'hsl(var(--primary))' }}>
            ✓ Your CV claims will be verified against this wallet's on-chain activity
          </p>
        </Card>
      )}

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Professional Summary *</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief overview of your Web3 experience, expertise, and career goals..."
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills">Skills & Technologies *</Label>
            <Textarea
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Solidity, Smart Contracts, DeFi, DAO Governance, Web3.js, React, etc."
              className="min-h-[80px]"
              required
            />
          </div>

          {/* Work Experience */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Work Experience</h3>
              <Button type="button" onClick={addExperience} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Experience
              </Button>
            </div>

            {experiences.map((exp, index) => (
              <Card key={exp.id} className="p-4 bg-accent/30">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Experience {index + 1}</h4>
                    {experiences.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(exp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company/Project *</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                        placeholder="Uniswap, Aave, etc."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role/Position *</Label>
                      <Input
                        value={exp.role}
                        onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                        placeholder="Smart Contract Developer"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Time Period</Label>
                    <Input
                      value={exp.period}
                      onChange={(e) => updateExperience(exp.id, 'period', e.target.value)}
                      placeholder="Jan 2021 - Dec 2022"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description & Achievements</Label>
                    <Textarea
                      value={exp.description}
                      onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                      placeholder="Describe your role, responsibilities, and key achievements..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Projects/Protocols (for on-chain verification)</Label>
                    <Input
                      value={exp.projects}
                      onChange={(e) => updateExperience(exp.id, 'projects', e.target.value)}
                      placeholder="e.g., Uniswap V3, Compound, MakerDAO"
                    />
                    <p className="text-xs text-muted-foreground">
                      List any protocols or projects you interacted with - we'll verify against your wallet
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Profile & Verifying...
              </>
            ) : (
              'Create CV Profile'
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};
