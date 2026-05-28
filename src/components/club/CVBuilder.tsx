import { useState } from "react";
import { Plus, X, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const MONO = "'Consolas', 'IBM Plex Mono', monospace";
const DISPLAY = "'Styrene A Trial', 'Consolas', monospace";
const INK = "#181818";
const CREAM = "#faf1e1";
const MUTED = "rgba(24,24,24,0.55)";
const BORDER = "rgba(24,24,24,0.18)";

const inputStyle: React.CSSProperties = {
  background: "transparent",
  border: `1.5px solid ${BORDER}`,
  color: INK,
  fontFamily: MONO,
  fontSize: 13,
  padding: "10px 14px",
  borderRadius: 999,
  outline: "none",
  width: "100%",
};

const textareaStyle: React.CSSProperties = {
  background: "transparent",
  border: `1.5px solid ${BORDER}`,
  color: INK,
  fontFamily: MONO,
  fontSize: 13,
  padding: "12px 16px",
  borderRadius: 16,
  outline: "none",
  width: "100%",
  resize: "none",
};

const labelStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: "0.18em",
  color: MUTED,
  textTransform: "uppercase",
  display: "block",
  marginBottom: 8,
};

const outlineBtn: React.CSSProperties = {
  background: "transparent",
  border: `1.5px solid ${INK}`,
  color: INK,
  fontFamily: MONO,
  fontSize: 12,
  padding: "8px 16px",
  borderRadius: 999,
  cursor: "pointer",
};

const filledBtn: React.CSSProperties = {
  background: INK,
  color: CREAM,
  fontFamily: MONO,
  fontSize: 13,
  padding: "12px 20px",
  borderRadius: 999,
  cursor: "pointer",
  border: "none",
  width: "100%",
};

export function CVBuilder({ memberData }: CVBuilderProps) {
  const { toast } = useToast();
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [portfolioLinks, setPortfolioLinks] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, { id: Date.now().toString(), name: newSkill.trim() }]);
      setNewSkill("");
    }
  };
  const removeSkill = (id: string) => setSkills(skills.filter((s) => s.id !== id));
  const addExperience = () =>
    setExperiences([
      ...experiences,
      { id: Date.now().toString(), company: "", role: "", period: "", description: "" },
    ]);
  const updateExperience = (id: string, field: keyof Experience, value: string) =>
    setExperiences(experiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)));
  const removeExperience = (id: string) => setExperiences(experiences.filter((exp) => exp.id !== id));

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({ title: "Profile saved", description: "Your professional profile has been updated" });
  };

  return (
    <div className="rounded-[20px] p-8" style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-6">
        <span className="uppercase" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}>
          {"01 / Profile"}
        </span>
        <span className="uppercase" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}>
          {"CV builder"}
        </span>
      </div>

      <div className="mb-6">
        <h2 style={{ fontFamily: DISPLAY, fontSize: 24, letterSpacing: "-0.03em", color: INK, fontWeight: 500 }}>
          {"Professional profile"}
        </h2>
        <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>{"Showcase your skills and experience"}</p>
      </div>

      <div className="space-y-6">
        {/* Member Info */}
        <div
          className="rounded-[16px] p-4 flex items-center justify-between"
          style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
        >
          <div>
            <p className="uppercase" style={{ ...labelStyle, marginBottom: 4 }}>
              {"Member ID"}
            </p>
            <p style={{ fontFamily: MONO, fontSize: 13, color: INK }}>
              {memberData?.display_name || memberData?.handle}
            </p>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label style={labelStyle}>{"Professional bio"}</label>
          <textarea
            placeholder="Describe your background, expertise, and what you're looking for..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={5}
            style={textareaStyle}
          />
        </div>

        {/* Skills */}
        <div>
          <label style={labelStyle}>{"Skills & expertise"}</label>
          <div className="flex gap-2">
            <input
              placeholder="Add a skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              style={inputStyle}
            />
            <button onClick={addSkill} style={{ ...outlineBtn, padding: "8px 12px" }}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
                  style={{
                    background: "transparent",
                    border: `1.5px solid ${BORDER}`,
                    fontFamily: MONO,
                    fontSize: 11,
                    color: INK,
                  }}
                >
                  {skill.name}
                  <button onClick={() => removeSkill(skill.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: MUTED }}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Experience */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label style={{ ...labelStyle, marginBottom: 0 }}>{"Web3 experience"}</label>
            <button onClick={addExperience} style={outlineBtn} className="inline-flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              {"Add role"}
            </button>
          </div>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="rounded-[16px] p-4 space-y-3"
                style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
              >
                <div className="flex justify-end">
                  <button
                    onClick={() => removeExperience(exp.id)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: MUTED }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>{"Company"}</label>
                    <input
                      placeholder="Company name"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>{"Role"}</label>
                    <input
                      placeholder="Your role"
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{"Period"}</label>
                  <input
                    placeholder="e.g. Jan 2023 — Dec 2024"
                    value={exp.period}
                    onChange={(e) => updateExperience(exp.id, "period", e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{"Description"}</label>
                  <textarea
                    placeholder="Describe your responsibilities and achievements..."
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                    rows={3}
                    style={textareaStyle}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Links */}
        <div>
          <label style={labelStyle}>{"Portfolio links"}</label>
          <textarea
            placeholder="GitHub, LinkedIn, personal site, etc. (one per line)"
            value={portfolioLinks}
            onChange={(e) => setPortfolioLinks(e.target.value)}
            rows={4}
            style={textareaStyle}
          />
        </div>

        {/* Save Button */}
        <button onClick={handleSave} disabled={isSaving} style={{ ...filledBtn, opacity: isSaving ? 0.6 : 1 }}>
          <span className="inline-flex items-center justify-center gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save profile"}
          </span>
        </button>
      </div>
    </div>
  );
}
