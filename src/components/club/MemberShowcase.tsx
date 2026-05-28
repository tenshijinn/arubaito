import { Sparkles, Lock } from "lucide-react";

const MONO = "'Consolas', 'IBM Plex Mono', monospace";
const DISPLAY = "'Styrene A Trial', 'Consolas', monospace";
const INK = "#181818";
const MUTED = "rgba(24,24,24,0.55)";
const BORDER = "rgba(24,24,24,0.18)";

export function MemberShowcase() {
  return (
    <div
      className="rounded-[20px] p-8"
      style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
    >
      <div className="flex items-center justify-between mb-6">
        <span className="uppercase" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}>
          {"04 / Spotlight"}
        </span>
        <span className="uppercase" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}>
          {"Coming soon"}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center"
          style={{ border: `1.5px solid ${BORDER}` }}
        >
          <Sparkles className="h-4 w-4" style={{ color: INK }} strokeWidth={1.5} />
        </div>
        <div>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 22, letterSpacing: "-0.02em", color: INK, fontWeight: 500 }}>
            {"Member spotlight"}
          </h2>
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
            {"Showcase your work and achievements"}
          </p>
        </div>
      </div>

      <div className="py-12 text-center space-y-6">
        <div
          className="mx-auto h-16 w-16 rounded-full flex items-center justify-center"
          style={{ border: `1.5px solid ${BORDER}` }}
        >
          <Lock className="h-6 w-6" style={{ color: INK }} strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <h3 style={{ fontFamily: DISPLAY, fontSize: 20, letterSpacing: "-0.02em", color: INK, fontWeight: 500 }}>
            {"Coming soon"}
          </h3>
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED, maxWidth: 380, margin: "0 auto", lineHeight: 1.7 }}>
            {"This exclusive section will allow members to showcase their projects, achievements, and contributions to the Web3 ecosystem."}
          </p>
        </div>
        <div
          className="rounded-[16px] p-5 max-w-md mx-auto text-left"
          style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
        >
          <p
            className="uppercase mb-3"
            style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
          >
            {"Planned features"}
          </p>
          <ul style={{ fontFamily: MONO, fontSize: 12, color: INK, lineHeight: 1.9 }}>
            <li>{"— Project portfolio galleries"}</li>
            <li>{"— Achievement badges & milestones"}</li>
            <li>{"— Peer endorsements & reviews"}</li>
            <li>{"— Case studies & success stories"}</li>
            <li>{"— Member-generated content"}</li>
          </ul>
        </div>
        <p
          className="uppercase"
          style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
        >
          {"Expected launch / Q3 2025"}
        </p>
      </div>
    </div>
  );
}
