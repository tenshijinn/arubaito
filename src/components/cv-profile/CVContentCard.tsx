import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  MapPin, 
  Briefcase, 
  Users, 
  Code, 
  Heart, 
  Languages, 
  GraduationCap, 
  Building,
  Gamepad2,
  Quote
} from "lucide-react";

interface PersonalInfo {
  name: string | null;
  location: string | null;
  professional_title: string | null;
}

interface Education {
  institution: string;
  degree: string;
  year: string;
}

interface WorkExperience {
  company: string;
  role: string;
  duration: string;
  highlights?: string[];
}

interface CVContent {
  personal_info?: PersonalInfo;
  describe_yourself?: string;
  web3_communities?: string[];
  hard_skills?: string[];
  soft_skills?: string[];
  languages?: string[];
  education?: Education[];
  work_experience?: WorkExperience[];
  hobbies?: string[];
}

interface CVContentCardProps {
  cvContent: CVContent | null;
}

export const CVContentCard = ({ cvContent }: CVContentCardProps) => {
  if (!cvContent) {
    return (
      <Card className="p-6 bg-transparent border-border/30 backdrop-blur-sm">
        <div className="text-center py-8">
          <User className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            CV details not available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Re-upload your CV to extract structured content
          </p>
        </div>
      </Card>
    );
  }

  const { 
    personal_info, 
    describe_yourself, 
    web3_communities, 
    hard_skills, 
    soft_skills, 
    languages, 
    education, 
    work_experience, 
    hobbies 
  } = cvContent;

  return (
    <Card className="p-6 bg-transparent border-border/30 backdrop-blur-sm">
      <div className="space-y-6">
        {/* Personal Information */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold uppercase tracking-wide">Personal Information</h4>
          </div>
          <div className="space-y-2 pl-6">
            {personal_info?.name && (
              <p className="text-sm font-medium">{personal_info.name}</p>
            )}
            {personal_info?.location && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{personal_info.location}</span>
              </div>
            )}
          </div>
        </section>

        {/* Professional Title */}
        {personal_info?.professional_title && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wide">Professional Title</h4>
            </div>
            <p className="text-sm pl-6 text-primary font-medium">
              {personal_info.professional_title}
            </p>
          </section>
        )}

        {/* Describe Yourself */}
        {describe_yourself && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Quote className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wide">About</h4>
            </div>
            <p className="text-xs text-muted-foreground pl-6 italic leading-relaxed">
              "{describe_yourself}"
            </p>
          </section>
        )}

        {/* Web3 Communities */}
        {web3_communities && web3_communities.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wide">Web3 Communities</h4>
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {web3_communities.map((community, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {community}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {((hard_skills && hard_skills.length > 0) || (soft_skills && soft_skills.length > 0)) && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Code className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wide">Skills</h4>
            </div>
            <div className="space-y-3 pl-6">
              {hard_skills && hard_skills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Hard Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {hard_skills.map((skill, i) => (
                      <Badge key={i} className="text-xs bg-primary/20 text-primary border-primary/30">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {soft_skills && soft_skills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Soft Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {soft_skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Languages className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wide">Languages</h4>
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {languages.map((lang, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wide">Education & Courses</h4>
            </div>
            <div className="space-y-2 pl-6">
              {education.map((edu, i) => (
                <div key={i} className="text-xs">
                  <p className="font-medium">{edu.institution}</p>
                  <p className="text-muted-foreground">
                    {edu.degree} {edu.year && `(${edu.year})`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Work Experience */}
        {work_experience && work_experience.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Building className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wide">Work Experience</h4>
            </div>
            <div className="space-y-3 pl-6">
              {work_experience.map((exp, i) => (
                <div key={i} className="text-xs border-l-2 border-primary/30 pl-3">
                  <p className="font-medium">{exp.company}</p>
                  <p className="text-primary">{exp.role}</p>
                  <p className="text-muted-foreground text-[10px]">{exp.duration}</p>
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {exp.highlights.slice(0, 2).map((h, j) => (
                        <li key={j} className="text-muted-foreground">• {h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hobbies */}
        {hobbies && hobbies.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wide">Hobbies</h4>
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {hobbies.map((hobby, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {hobby}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </div>
    </Card>
  );
};
