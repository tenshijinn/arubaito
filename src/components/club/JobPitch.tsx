import { useState } from "react";
import { Rocket, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JobPitchProps {
  memberData: any;
}

const RATE_TYPES = ["Hourly", "Project", "Full-time", "Part-time"] as const;
const AVAILABILITY = ["Immediate", "2 weeks", "1 month", "Flexible"] as const;

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

export function JobPitch({ memberData }: JobPitchProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [rateType, setRateType] = useState<(typeof RATE_TYPES)[number]>("Project");
  const [rate, setRate] = useState("");
  const [availability, setAvailability] = useState<(typeof AVAILABILITY)[number]>("Immediate");
  const [specialization, setSpecialization] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !pitch) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    toast({ title: "Pitch submitted", description: "Your job pitch is now visible to verified companies" });
    setTitle("");
    setPitch("");
    setRate("");
    setSpecialization("");
  };

  const pillBtn = (active: boolean): React.CSSProperties => ({
    background: active ? INK : "transparent",
    color: active ? CREAM : INK,
    border: `1.5px solid ${active ? INK : BORDER}`,
    fontFamily: MONO,
    fontSize: 11,
    padding: "8px 14px",
    borderRadius: 999,
    cursor: "pointer",
  });

  return (
    <div className="rounded-[20px] p-8" style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-6">
        <span className="uppercase" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}>
          {"02 / Pitch"}
        </span>
        <span className="uppercase" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}>
          {"Job board"}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center"
          style={{ border: `1.5px solid ${BORDER}` }}
        >
          <Rocket className="h-4 w-4" style={{ color: INK }} strokeWidth={1.5} />
        </div>
        <div>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 24, letterSpacing: "-0.03em", color: INK, fontWeight: 500 }}>
            {"Job pitch"}
          </h2>
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>{"Showcase what you're looking for"}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div
          className="rounded-[16px] p-4 flex items-center justify-between"
          style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
        >
          <div>
            <p style={{ ...labelStyle, marginBottom: 4 }}>{"Pitching as"}</p>
            <p style={{ fontFamily: MONO, fontSize: 13, color: INK }}>
              {memberData?.display_name || memberData?.handle}
            </p>
          </div>
          <span
            className="uppercase px-3 py-1 rounded-full"
            style={{
              fontFamily: MONO,
              fontSize: 9,
              letterSpacing: "0.18em",
              color: INK,
              border: `1.5px solid ${BORDER}`,
            }}
          >
            {"Verified"}
          </span>
        </div>

        <div>
          <label style={labelStyle}>{"Pitch headline *"}</label>
          <input
            placeholder="e.g. Experienced Solidity dev seeking DeFi project"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>{"Your pitch *"}</label>
          <textarea
            placeholder="Tell companies what you're looking for, your unique value, and why they should hire you..."
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            rows={7}
            style={textareaStyle}
          />
          <p
            className="mt-2"
            style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}
          >
            {pitch.length} / 1000 characters
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>{"Rate type"}</label>
            <div className="flex flex-wrap gap-2">
              {RATE_TYPES.map((type) => (
                <button key={type} onClick={() => setRateType(type)} style={pillBtn(rateType === type)}>
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>{"Expected rate (USD)"}</label>
            <input
              placeholder="e.g. 150/hr or 10000/project"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>{"Availability"}</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY.map((avail) => (
              <button key={avail} onClick={() => setAvailability(avail)} style={pillBtn(availability === avail)}>
                {avail}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>{"Key specialization"}</label>
          <input
            placeholder="e.g. Smart contract auditing, DeFi protocols, NFT marketplaces"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !pitch}
            className="w-full px-5 py-3 rounded-full transition-opacity hover:opacity-80 disabled:opacity-60"
            style={{ background: INK, color: CREAM, fontFamily: MONO, fontSize: 13, border: "none" }}
          >
            <span className="inline-flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              {isSubmitting ? "Submitting..." : "Submit pitch"}
            </span>
          </button>
          <p
            className="mt-3 text-center uppercase"
            style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
          >
            {"Visible to verified Web3 companies"}
          </p>
        </div>
      </div>
    </div>
  );
}
