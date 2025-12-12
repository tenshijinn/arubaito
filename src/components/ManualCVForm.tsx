import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, ArrowLeft, Wallet, CheckCircle2 } from "lucide-react";
import { WalletAddresses } from "@/components/cv-profile/WalletConnectStep";

interface WorkExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  highlights: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

interface ManualCVFormProps {
  onBack: () => void;
  onComplete: (analysisId: string) => void;
  walletAddress?: string;
  walletAddresses?: WalletAddresses;
  prefillData?: PrefillData;
}

export interface PrefillData {
  fullName?: string;
  email?: string;
  professionalTitle?: string;
  location?: string;
  summary?: string;
  profileImageUrl?: string;
}

export const ManualCVForm = ({ onBack, onComplete, walletAddress, walletAddresses, prefillData }: ManualCVFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Form state - Personal Info
  const [fullName, setFullName] = useState(prefillData?.fullName || "");
  const [email, setEmail] = useState(prefillData?.email || "");
  const [location, setLocation] = useState(prefillData?.location || "");
  const [professionalTitle, setProfessionalTitle] = useState(prefillData?.professionalTitle || "");
  
  // About / Summary
  const [summary, setSummary] = useState(prefillData?.summary || "");
  
  // Skills (separated)
  const [hardSkills, setHardSkills] = useState("");
  const [softSkills, setSoftSkills] = useState("");
  
  // Web3 Communities
  const [web3Communities, setWeb3Communities] = useState("");
  
  // Languages
  const [languages, setLanguages] = useState("");
  
  // Hobbies
  const [hobbies, setHobbies] = useState("");
  
  // Education
  const [education, setEducation] = useState<Education[]>([
    { id: '1', institution: '', degree: '', year: '' }
  ]);
  
  // Work Experience
  const [experiences, setExperiences] = useState<WorkExperience[]>([
    { id: '1', company: '', role: '', period: '', highlights: '' }
  ]);

  // Education handlers
  const addEducation = () => {
    setEducation([
      ...education,
      { id: Date.now().toString(), institution: '', degree: '', year: '' }
    ]);
  };

  const removeEducation = (id: string) => {
    if (education.length > 1) {
      setEducation(education.filter(edu => edu.id !== id));
    }
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEducation(education.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  // Experience handlers
  const addExperience = () => {
    setExperiences([
      ...experiences,
      { id: Date.now().toString(), company: '', role: '', period: '', highlights: '' }
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
    if (!fullName || !email || !summary) {
      toast({
        title: "Missing Information",
        description: "Please fill out name, email, and summary",
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

      // Build structured CV content from form data
      const cvContent = `
FULL NAME: ${fullName}
EMAIL: ${email}
LOCATION: ${location}
PROFESSIONAL TITLE: ${professionalTitle}

PROFESSIONAL SUMMARY / ABOUT ME:
${summary}

HARD SKILLS / TECHNICAL SKILLS:
${hardSkills}

SOFT SKILLS:
${softSkills}

WEB3 COMMUNITIES & DAOS:
${web3Communities}

LANGUAGES:
${languages}

HOBBIES & INTERESTS:
${hobbies}

EDUCATION:
${education.filter(edu => edu.institution).map(edu => `
Institution: ${edu.institution}
Degree/Certification: ${edu.degree}
Year: ${edu.year}
`).join('\n')}

WORK EXPERIENCE:
${experiences.map(exp => `
Company/Project: ${exp.company}
Role: ${exp.role}
Period: ${exp.period}
Key Achievements/Highlights:
${exp.highlights}
`).join('\n')}
`;

      // Call edge function to analyze
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-cv',
        {
          body: { 
            fileName: `${fullName.replace(/\s+/g, '_')}_manual_cv.txt`,
            fileContent: cvContent,
            walletAddress: walletAddress || null,
            solanaWalletAddress: walletAddresses?.solana || null,
            evmWalletAddress: walletAddresses?.evm || null
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
          ? "Your CV profile has been created and OG verified!" 
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
        <h2 className="text-2xl font-bold">
          {prefillData ? 'Complete Your Profile' : 'Manual CV Profile Form'}
        </h2>
      </div>

      {/* Dual Wallet Status Banner */}
      {(walletAddresses?.solana || walletAddresses?.evm) ? (
        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-medium text-green-500">Wallets Connected for Verification</span>
          </div>
          {walletAddresses?.solana && (
            <div className="mb-2">
              <span className="text-xs text-green-500 font-medium">Solana:</span>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {walletAddresses.solana}
              </p>
            </div>
          )}
          {walletAddresses?.evm && (
            <div className="mb-2">
              <span className="text-xs text-green-500 font-medium">EVM:</span>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {walletAddresses.evm}
              </p>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            ✓ Projects and protocols you mention will be verified against on-chain activity
          </p>
        </Card>
      ) : (
        <Card className="p-4 bg-accent/30 border-dashed">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">No Wallet Connected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your profile will be created without on-chain verification
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Personal Information
            </h3>
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
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professionalTitle">Professional Title</Label>
                <Input
                  id="professionalTitle"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  placeholder="Senior Web3 Developer"
                />
              </div>
            </div>
          </div>

          {/* About / Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              About You
            </h3>
            <div className="space-y-2">
              <Label htmlFor="summary">Professional Summary *</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Describe yourself, your Web3 experience, expertise, and career goals..."
                className="min-h-[120px]"
                required
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Skills
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hardSkills">Hard Skills / Technical Skills</Label>
                <Textarea
                  id="hardSkills"
                  value={hardSkills}
                  onChange={(e) => setHardSkills(e.target.value)}
                  placeholder="Solidity, Smart Contracts, Web3.js, React, Rust, TypeScript, DeFi protocols..."
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Separate skills with commas
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="softSkills">Soft Skills</Label>
                <Textarea
                  id="softSkills"
                  value={softSkills}
                  onChange={(e) => setSoftSkills(e.target.value)}
                  placeholder="Leadership, Communication, Problem-solving, Team collaboration..."
                  className="min-h-[60px]"
                />
              </div>
            </div>
          </div>

          {/* Web3 Communities */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Web3 Communities & DAOs
            </h3>
            <div className="space-y-2">
              <Label htmlFor="web3Communities">Communities You're Part Of</Label>
              <Textarea
                id="web3Communities"
                value={web3Communities}
                onChange={(e) => setWeb3Communities(e.target.value)}
                placeholder="BanklessDAO, Gitcoin, ENS DAO, MakerDAO, Uniswap Governance..."
                className="min-h-[60px]"
              />
              <p className="text-xs text-muted-foreground">
                List DAOs, communities, and organizations you participate in
              </p>
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Languages
            </h3>
            <div className="space-y-2">
              <Label htmlFor="languages">Languages You Speak</Label>
              <Input
                id="languages"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="English (Native), Spanish (Conversational), Japanese (Basic)"
              />
            </div>
          </div>

          {/* Education */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-lg font-semibold text-foreground">Education & Certifications</h3>
              <Button type="button" onClick={addEducation} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {education.map((edu, index) => (
              <Card key={edu.id} className="p-4 bg-accent/30">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-muted-foreground">Education {index + 1}</h4>
                    {education.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(edu.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                        placeholder="MIT, Coursera, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Degree / Certification</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                        placeholder="BS Computer Science"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        value={edu.year}
                        onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                        placeholder="2020"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Work Experience */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
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
                    <h4 className="font-medium text-sm text-muted-foreground">Experience {index + 1}</h4>
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
                      <Label>Company / Project *</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                        placeholder="Uniswap, Aave, etc."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role / Position *</Label>
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
                    <Label>Key Achievements & Highlights</Label>
                    <Textarea
                      value={exp.highlights}
                      onChange={(e) => updateExperience(exp.id, 'highlights', e.target.value)}
                      placeholder="• Led development of V3 smart contracts&#10;• Increased protocol TVL by 50%&#10;• Conducted security audits"
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use bullet points (•) to list key achievements - these will be verified against your wallet
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Hobbies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Hobbies & Interests (Optional)
            </h3>
            <div className="space-y-2">
              <Label htmlFor="hobbies">What do you enjoy outside of work?</Label>
              <Input
                id="hobbies"
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                placeholder="Gaming, Photography, Open source, Hackathons..."
              />
            </div>
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
