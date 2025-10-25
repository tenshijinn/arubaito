import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CVBuilderProps {
  memberData: any;
}

interface Skill {
  id: string;
  name: string;
}

interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
}

export function CVBuilder({ memberData }: CVBuilderProps) {
  const { toast } = useToast();
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [portfolioLinks, setPortfolioLinks] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, { id: Date.now().toString(), name: newSkill.trim() }]);
      setNewSkill('');
    }
  };

  const removeSkill = (id: string) => {
    setSkills(skills.filter(s => s.id !== id));
  };

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: Date.now().toString(),
        company: '',
        role: '',
        period: '',
        description: '',
      },
    ]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setExperiences(experiences.map(exp =>
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: 'Profile Saved',
      description: 'Your professional profile has been updated',
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-transparent border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-mono text-foreground">PROFESSIONAL PROFILE</CardTitle>
          <p className="text-sm text-muted-foreground font-mono">
            SHOWCASE YOUR SKILLS AND EXPERIENCE
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Member Info */}
          <div className="p-4 bg-background border border-border space-y-2">
            <p className="text-xs text-muted-foreground font-mono">MEMBER ID</p>
            <p className="text-sm font-mono text-foreground">{memberData?.display_name || memberData?.handle}</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="font-mono text-sm">PROFESSIONAL BIO</Label>
            <Textarea
              id="bio"
              placeholder="DESCRIBE YOUR BACKGROUND, EXPERTISE, AND WHAT YOU'RE LOOKING FOR..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={6}
              className="font-mono text-sm resize-none"
            />
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <Label className="font-mono text-sm">SKILLS & EXPERTISE</Label>
            <div className="flex gap-2">
              <Input
                placeholder="ADD A SKILL..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                className="font-mono text-sm"
              />
              <Button onClick={addSkill} size="sm" variant="outline" className="font-mono">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="secondary"
                    className="font-mono text-xs pl-3 pr-1 py-1 bg-primary/10 border-primary/20 text-foreground"
                  >
                    {skill.name}
                    <button
                      onClick={() => removeSkill(skill.id)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Experience */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-sm">WEB3 EXPERIENCE</Label>
              <Button onClick={addExperience} size="sm" variant="outline" className="font-mono text-xs">
                <Plus className="h-4 w-4 mr-1" />
                ADD ROLE
              </Button>
            </div>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <Card key={exp.id} className="bg-transparent border border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeExperience(exp.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="font-mono text-xs">COMPANY</Label>
                        <Input
                          placeholder="COMPANY NAME"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="font-mono text-xs">ROLE</Label>
                        <Input
                          placeholder="YOUR ROLE"
                          value={exp.role}
                          onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="font-mono text-xs">PERIOD</Label>
                      <Input
                        placeholder="E.G. JAN 2023 - DEC 2024"
                        value={exp.period}
                        onChange={(e) => updateExperience(exp.id, 'period', e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-mono text-xs">DESCRIPTION</Label>
                      <Textarea
                        placeholder="DESCRIBE YOUR RESPONSIBILITIES AND ACHIEVEMENTS..."
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                        rows={3}
                        className="font-mono text-sm resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Portfolio Links */}
          <div className="space-y-2">
            <Label htmlFor="portfolio" className="font-mono text-sm">PORTFOLIO LINKS</Label>
            <Textarea
              id="portfolio"
              placeholder="GITHUB, LINKEDIN, PERSONAL SITE, ETC. (ONE PER LINE)"
              value={portfolioLinks}
              onChange={(e) => setPortfolioLinks(e.target.value)}
              rows={4}
              className="font-mono text-sm resize-none"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full font-mono"
            size="lg"
          >
            {isSaving ? (
              <>SAVING...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                SAVE PROFILE
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
