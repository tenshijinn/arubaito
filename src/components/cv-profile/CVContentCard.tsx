import { User, MapPin, Briefcase, Users, Code, Languages, GraduationCap, Building, Gamepad2, Quote } from "lucide-react";
import { INK, CREAM, ACCENT, MUTED, BORDER, DISPLAY, MONO, cardStyle, labelStyle } from "@/lib/aesthetics";

interface PersonalInfo { name: string | null; location: string | null; professional_title: string | null }
interface Education { institution: string; degree: string; year: string }
interface WorkExperience { company: string; role: string; duration: string; highlights?: string[] }
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

interface CVContentCardProps { cvContent: CVContent | null }

const Pill = ({ children, solid = false }: { children: React.ReactNode; solid?: boolean }) => (
  <span
    className="px-2.5 py-1 rounded-full inline-flex items-center"
    style={
      solid
        ? { background: INK, color: CREAM, fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em" }
        : { border: `1px solid ${BORDER}`, color: INK, fontFamily: MONO, fontSize: 10 }
    }
  >
    {children}
  </span>
);

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className="h-3.5 w-3.5" style={{ color: INK }} />
    <span style={labelStyle()}>{title}</span>
  </div>
);

export const CVContentCard = ({ cvContent }: CVContentCardProps) => {
  if (!cvContent) {
    return (
      <div style={cardStyle()} className="p-6">
        <div className="flex items-center justify-between mb-6">
          <span style={labelStyle()}>{"05 / CV"}</span>
          <span style={labelStyle()}>{"Content"}</span>
        </div>
        <div className="text-center py-8">
          <User className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(24,24,24,0.2)" }} />
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>CV details not available</p>
        </div>
      </div>
    );
  }

  const { personal_info, describe_yourself, web3_communities, hard_skills, soft_skills, languages, education, work_experience, hobbies } = cvContent;

  return (
    <div style={cardStyle()} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <span style={labelStyle()}>{"05 / CV"}</span>
        <span style={labelStyle()}>{"Content"}</span>
      </div>

      <div className="space-y-6">
        <section>
          <SectionHeader icon={User} title="Personal Information" />
          <div className="space-y-2 pl-5">
            {personal_info?.name && (<p style={{ fontFamily: DISPLAY, fontSize: 18, color: INK }}>{personal_info.name}</p>)}
            {personal_info?.location && (
              <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                <MapPin className="h-3 w-3" /><span>{personal_info.location}</span>
              </div>
            )}
          </div>
        </section>

        {personal_info?.professional_title && (
          <section>
            <SectionHeader icon={Briefcase} title="Professional Title" />
            <p className="pl-5" style={{ fontFamily: MONO, fontSize: 13, color: INK }}>{personal_info.professional_title}</p>
          </section>
        )}

        {describe_yourself && (
          <section>
            <SectionHeader icon={Quote} title="About" />
            <p className="pl-5" style={{ fontFamily: MONO, fontSize: 12, color: MUTED, fontStyle: "italic", lineHeight: 1.7 }}>
              "{describe_yourself}"
            </p>
          </section>
        )}

        {web3_communities && web3_communities.length > 0 && (
          <section>
            <SectionHeader icon={Users} title="Web3 Communities" />
            <div className="flex flex-wrap gap-2 pl-5">{web3_communities.map((c, i) => <Pill key={i}>{c}</Pill>)}</div>
          </section>
        )}

        {((hard_skills && hard_skills.length > 0) || (soft_skills && soft_skills.length > 0)) && (
          <section>
            <SectionHeader icon={Code} title="Skills" />
            <div className="space-y-3 pl-5">
              {hard_skills && hard_skills.length > 0 && (
                <div>
                  <p style={{ ...labelStyle(), marginBottom: 6 }}>Hard Skills</p>
                  <div className="flex flex-wrap gap-1.5">{hard_skills.map((s, i) => <Pill key={i} solid>{s}</Pill>)}</div>
                </div>
              )}
              {soft_skills && soft_skills.length > 0 && (
                <div>
                  <p style={{ ...labelStyle(), marginBottom: 6 }}>Soft Skills</p>
                  <div className="flex flex-wrap gap-1.5">{soft_skills.map((s, i) => <Pill key={i}>{s}</Pill>)}</div>
                </div>
              )}
            </div>
          </section>
        )}

        {languages && languages.length > 0 && (
          <section>
            <SectionHeader icon={Languages} title="Languages" />
            <div className="flex flex-wrap gap-2 pl-5">{languages.map((l, i) => <Pill key={i}>{l}</Pill>)}</div>
          </section>
        )}

        {education && education.length > 0 && (
          <section>
            <SectionHeader icon={GraduationCap} title="Education & Courses" />
            <div className="space-y-2 pl-5">
              {education.map((edu, i) => (
                <div key={i}>
                  <p style={{ fontFamily: MONO, fontSize: 12, color: INK }}>{edu.institution}</p>
                  <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                    {edu.degree} {edu.year && `(${edu.year})`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {work_experience && work_experience.length > 0 && (
          <section>
            <SectionHeader icon={Building} title="Work Experience" />
            <div className="space-y-3 pl-5">
              {work_experience.map((exp, i) => (
                <div key={i} className="pl-3" style={{ borderLeft: `2px solid ${BORDER}` }}>
                  <p style={{ fontFamily: MONO, fontSize: 12, color: INK }}>{exp.company}</p>
                  <p style={{ fontFamily: MONO, fontSize: 11, color: ACCENT }}>{exp.role}</p>
                  <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{exp.duration}</p>
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {exp.highlights.slice(0, 2).map((h, j) => (
                        <li key={j} style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>• {h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {hobbies && hobbies.length > 0 && (
          <section>
            <SectionHeader icon={Gamepad2} title="Hobbies" />
            <div className="flex flex-wrap gap-2 pl-5">{hobbies.map((h, i) => <Pill key={i}>{h}</Pill>)}</div>
          </section>
        )}
      </div>
    </div>
  );
};
