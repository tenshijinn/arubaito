import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Circle, Plus, Minus, Search, Settings2 } from "lucide-react";

// Neo-minimalist industrial aesthetic playground
// Palette: warm off-white surfaces, graphite text, sparse muted accents
// Inspirations: Braun, Teenage Engineering, Nothing OS, MUJI, Swiss editorial

// Palette — platform tokens only
const CREAM = "#faf1e1";        // primary surface (warm cream)
const PAPER = "#f5ead7";        // slightly deeper card surface
const SURFACE = "#efe2c9";      // sunken / input surface
const CONCRETE = "#e3d4b6";     // muted fill
const INK = "#181818";          // primary text / dark surfaces
const GRAPHITE = "#2a2a2a";
const MUTED = "rgba(24,24,24,0.55)";
const BORDER = "rgba(24,24,24,0.18)";
const ACCENT = "#ed565a";       // sole accent

// Typography — keep terminal-esk feel
const SANS = "'Consolas', 'IBM Plex Mono', monospace";
const DISPLAY = "'Styrene A Trial', 'Consolas', monospace";
const MONO = "'Consolas', 'IBM Plex Mono', monospace";

// ── Primitives ──────────────────────────────────────────────────────────────

const Label = ({ children, className = "", inverted = false }: { children: React.ReactNode; className?: string; inverted?: boolean }) => (
  <span
    className={`uppercase tracking-[0.18em] ${className}`}
    style={{ fontFamily: MONO, fontSize: 10, color: inverted ? "rgba(239,226,201,0.55)" : MUTED }}
  >
    {children}
  </span>
);

const Card = ({
  children,
  className = "",
  padded = true,
  inverted = false,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  inverted?: boolean;
}) => (
  <div
    className={`rounded-[20px] ${className}`}
    style={{
      background: inverted ? INK : "transparent",
      border: `1.5px solid ${inverted ? "rgba(239,226,201,0.18)" : BORDER}`,
      padding: padded ? 24 : 0,
    }}
  >
    {children}
  </div>
);

const Divider = () => <div style={{ height: 1, background: BORDER, width: "100%" }} />;

const VDivider = () => <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />;

// ── Section: Buttons ────────────────────────────────────────────────────────

const ButtonsSection = () => (
  <Card>
    <div className="flex items-center justify-between mb-6">
      <Label>01 / Controls</Label>
      <Label>Buttons & Toggles</Label>
    </div>
    <div className="flex flex-wrap gap-3 items-center">
      <button
        className="px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-80"
        style={{ background: INK, color: CREAM, fontFamily: SANS }}
      >
        Apply now
      </button>
      <button
        className="px-5 py-2.5 rounded-full text-sm transition-colors"
        style={{
          background: "transparent",
          color: INK,
          border: `1.5px solid ${INK}`,
          fontFamily: SANS,
        }}
      >
        View brief
      </button>
      <button
        className="px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-80"
        style={{ background: ACCENT, color: PAPER, fontFamily: SANS }}
      >
        Submit
      </button>
      <button
        className="px-4 py-2 rounded-full text-xs uppercase tracking-wider"
        style={{ background: "transparent", color: GRAPHITE, border: `1.5px solid ${BORDER}`, fontFamily: MONO }}
      >
        ← Back
      </button>
      <button
        className="h-10 w-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
        style={{ border: `1.5px solid ${BORDER}` }}
        aria-label="Add"
      >
        <Plus size={16} strokeWidth={1.5} color={INK} />
      </button>
      <button
        className="h-10 w-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
        style={{ border: `1.5px solid ${BORDER}` }}
        aria-label="Settings"
      >
        <Settings2 size={16} strokeWidth={1.5} color={INK} />
      </button>
    </div>

    <div className="mt-8">
      <Label>Segmented control</Label>
      <div
        className="inline-flex mt-3 p-1 rounded-full"
        style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
      >
        {["Overview", "On-chain", "Network", "Logs"].map((t, i) => (
          <button
            key={t}
            className="px-4 py-1.5 rounded-full text-xs transition-colors"
            style={{
              background: i === 0 ? "transparent" : "transparent",
              color: i === 0 ? INK : MUTED,
              fontFamily: SANS,
              border: i === 0 ? `1.5px solid ${BORDER}` : "1.5px solid transparent",
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  </Card>
);

// ── Section: Inputs ─────────────────────────────────────────────────────────

const InputsSection = () => (
  <Card inverted>
    <div className="flex items-center justify-between mb-6">
      <Label inverted>02 / Inputs</Label>
      <Label inverted>Appliance controls</Label>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label inverted>Handle</Label>
        <div
          className="mt-2 flex items-center gap-2 px-4 py-3 rounded-full"
          style={{ background: "transparent", border: `1.5px solid rgba(239,226,201,0.18)` }}
        >
          <Search size={14} strokeWidth={1.5} color="rgba(239,226,201,0.55)" />
          <input
            placeholder="@arubaito_app"
            className="bg-transparent outline-none flex-1 text-sm"
            style={{ color: SURFACE, fontFamily: SANS }}
          />
        </div>
      </div>
      <div>
        <Label inverted>Temperature</Label>
        <div
          className="mt-2 flex items-center justify-between px-4 py-3 rounded-full"
          style={{ background: "transparent", border: `1.5px solid rgba(239,226,201,0.18)` }}
        >
          <button className="h-6 w-6 rounded-full flex items-center justify-center" style={{ border: `1.5px solid rgba(239,226,201,0.18)` }}>
            <Minus size={12} strokeWidth={1.5} color={SURFACE} />
          </button>
          <span style={{ fontFamily: DISPLAY, fontSize: 22, color: SURFACE, letterSpacing: "-0.02em" }}>
            19.0°C
          </span>
          <button className="h-6 w-6 rounded-full flex items-center justify-center" style={{ border: `1.5px solid rgba(239,226,201,0.18)` }}>
            <Plus size={12} strokeWidth={1.5} color={SURFACE} />
          </button>
        </div>
      </div>
    </div>

    <div className="mt-6 flex items-center justify-between py-4" style={{ borderTop: `1.5px solid rgba(239,226,201,0.18)` }}>
      <div>
        <div style={{ fontFamily: SANS, fontSize: 14, color: SURFACE }}>Auto-sync on-chain activity</div>
        <Label inverted>Refresh every 24h</Label>
      </div>
      <Toggle inverted />
    </div>
    <div className="flex items-center justify-between py-4" style={{ borderTop: `1.5px solid rgba(239,226,201,0.18)` }}>
      <div>
        <div style={{ fontFamily: SANS, fontSize: 14, color: SURFACE }}>Public profile</div>
        <Label inverted>Visible to recruiters</Label>
      </div>
      <Toggle inverted defaultOn={false} />
    </div>
  </Card>
);

const Toggle = ({ defaultOn = true, inverted = false }: { defaultOn?: boolean; inverted?: boolean }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className="relative h-7 w-12 rounded-full transition-colors"
      style={{
        background: on ? (inverted ? SURFACE : INK) : "transparent",
        border: `1.5px solid ${inverted ? "rgba(239,226,201,0.18)" : BORDER}`,
      }}
    >
      <div
        className="absolute top-0.5 h-5 w-5 rounded-full transition-all"
        style={{
          background: on ? (inverted ? INK : PAPER) : (inverted ? "transparent" : PAPER),
          border: !on && inverted ? "1.5px solid rgba(239,226,201,0.55)" : "none",
          left: on ? 22 : 2,
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}
      />
    </button>
  );
};

// ── Section: Metric Tiles (Braun / TE telemetry) ───────────────────────────

const MetricTile = ({
  label,
  value,
  unit,
  meta,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  meta?: string;
  accent?: string;
}) => (
  <Card>
    <Label>{label}</Label>
    <div className="mt-4 flex items-baseline gap-1">
      <span
        style={{
          fontFamily: DISPLAY,
          fontSize: 44,
          letterSpacing: "-0.04em",
          color: INK,
          lineHeight: 1,
          fontWeight: 500,
        }}
      >
        {value}
      </span>
      {unit && (
        <span style={{ fontFamily: SANS, fontSize: 14, color: MUTED }}>{unit}</span>
      )}
    </div>
    {meta && (
      <div className="mt-3 flex items-center gap-1.5">
        {accent && (
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: accent }}
          />
        )}
        <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>{meta}</span>
      </div>
    )}
  </Card>
);

// ── Section: Radial Indicator (HRV/Respiratory style) ──────────────────────

const RadialIndicator = () => {
  const score = 82;
  const total = 100;
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const segments = 24;
  const filledSegments = Math.round((score / total) * segments);
  const segOuter = 92;
  const segInner = 64;
  const segWidth = 9;
  const gapDeg = 3;
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <Label>OG Score</Label>
        <Label>Live</Label>
      </div>
      <div className="flex items-center justify-center py-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {Array.from({ length: segments }).map((_, i) => {
              const stepDeg = 360 / segments;
              const angle = i * stepDeg - 90 + gapDeg / 2;
              const isFilled = i < filledSegments;
              const rectH = segOuter - segInner;
              return (
                <g key={i} transform={`rotate(${angle} ${cx} ${cy})`}>
                  <rect
                    x={cx - segWidth / 2}
                    y={cy - segOuter}
                    width={segWidth}
                    height={rectH}
                    rx={2.5}
                    ry={2.5}
                    fill={isFilled ? ACCENT : INK}
                    stroke={isFilled ? ACCENT : INK}
                    strokeWidth={1.5}
                    transform={`rotate(${stepDeg / 2 - gapDeg / 2} ${cx} ${cy})`}
                  />
                </g>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              style={{
                fontFamily: DISPLAY,
                fontSize: 48,
                color: INK,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                fontWeight: 500,
              }}
            >
              {score}
              <span style={{ fontFamily: MONO, fontSize: 16, color: MUTED, marginLeft: 2 }}>%</span>
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED, marginTop: 6, letterSpacing: "0.15em" }}>
              {score}/{total}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};


// ── Section: ASCII Bar Chart (Treasury) ────────────────────────────────────

const LineGraph = () => {
  // Sales-growth style: dense vertical lines spanning the card width
  const barCount = 56;
  // smooth-ish upward trend with subtle noise
  const values = Array.from({ length: barCount }, (_, i) => {
    const base = Math.pow(i / (barCount - 1), 1.8); // 0 → 1, eased
    const noise = (Math.sin(i * 1.3) + Math.sin(i * 0.7)) * 0.04;
    return Math.max(0.02, base + noise);
  });
  const max = Math.max(...values);
  const chartHeight = 80;
  const minH = 2;
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <Label>Treasury Balance</Label>
        <Label>30d</Label>
      </div>
      <div className="flex items-baseline gap-2 mb-5">
        <span style={{ fontFamily: DISPLAY, fontSize: 38, color: INK, letterSpacing: "-0.04em", fontWeight: 500 }}>
          12.84
        </span>
        <span style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>SOL / +1.6%</span>
      </div>
      <div
        className="flex items-end justify-between w-full"
        style={{ height: chartHeight, gap: 2 }}
      >
        {values.map((v, i) => {
          const h = Math.max(minH, (v / max) * chartHeight);
          const isLast = i === values.length - 1;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: h,
                background: isLast ? ACCENT : INK,
                borderRadius: 1,
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-3" style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>
        {["Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </Card>
  );
};


// ── Section: Streak (week-streak inspiration) ──────────────────────────────

const StreakCard = () => {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const completed = [false, true, false, true, false, false, false];
  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <Label>Your Streak</Label>
        <Label>Week 07</Label>
      </div>
      <div className="flex items-baseline gap-2 mb-8">
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: 72,
            color: INK,
            letterSpacing: "-0.05em",
            lineHeight: 0.9,
            fontWeight: 500,
          }}
        >
          7
        </span>
        <span style={{ fontFamily: DISPLAY, fontSize: 24, color: INK, letterSpacing: "-0.02em" }}>
          weeks
        </span>
      </div>
      <div className="flex justify-between items-center">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center"
              style={{
                background: completed[i] ? ACCENT : "transparent",
                border: completed[i] ? "none" : `1.5px solid ${BORDER}`,
              }}
            >
              {completed[i] && <Check size={14} strokeWidth={2} color={PAPER} />}
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{d}</span>
          </div>
        ))}
      </div>
      <div className="mt-6" style={{ fontFamily: SANS, fontSize: 14, color: GRAPHITE, lineHeight: 1.5 }}>
        Keep pushing — your previous record was 10 weeks in a row.
      </div>
    </Card>
  );
};

// ── Section: Member / Profile Card ─────────────────────────────────────────

const ProfileCard = () => (
  <Card>
    <div className="flex items-center justify-between mb-6">
      <Label>Member 0142</Label>
      <span
        className="px-2 py-1 rounded-full text-[10px] uppercase tracking-wider"
        style={{ border: `1.5px solid ${BORDER}`, color: INK, fontFamily: MONO }}
      >
        OG Verified
      </span>
    </div>
    <div className="flex items-start gap-4">
      <div
        className="h-16 w-16 rounded-full shrink-0"
        style={{ background: CONCRETE, border: `1.5px solid ${BORDER}` }}
      />
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: DISPLAY, fontSize: 22, color: INK, letterSpacing: "-0.02em", fontWeight: 500 }}>
          Wayne Anthony
        </div>
        <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>
          Founder · Arubaito
        </div>
      </div>
    </div>
    <div className="grid grid-cols-3 mt-6" style={{ borderTop: `1.5px solid ${BORDER}` }}>
      {[
        { l: "On-chain", v: "14" },
        { l: "Endorsed", v: "37" },
        { l: "Streak", v: "7w" },
      ].map((m, i) => (
        <div
          key={m.l}
          className="py-4 flex flex-col items-start"
          style={{ borderLeft: i === 0 ? "none" : `1.5px solid ${BORDER}`, paddingLeft: i === 0 ? 0 : 16 }}
        >
          <Label>{m.l}</Label>
          <span
            className="mt-2"
            style={{ fontFamily: DISPLAY, fontSize: 22, color: INK, letterSpacing: "-0.02em", fontWeight: 500 }}
          >
            {m.v}
          </span>
        </div>
      ))}
    </div>
  </Card>
);

// ── Section: List rows (schedule style) ────────────────────────────────────

const ListRows = () => {
  const rows = [
    { label: "Business Development", meta: "Commission", active: true },
    { label: "Twitter Marketer", meta: "Contract", active: false },
    { label: "Operations Manager", meta: "Full-time", active: true },
    { label: "Protocol Researcher", meta: "Part-time", active: false },
  ];
  return (
    <Card padded={false}>
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Label>03 / Mission Board</Label>
        <button style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>+ ADD</button>
      </div>
      <Divider />
      {rows.map((r, i) => (
        <div key={i}>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: r.active ? ACCENT : CONCRETE }}
              />
              <span style={{ fontFamily: SANS, fontSize: 14, color: INK }} className="truncate">
                {r.label}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>{r.meta}</span>
              <Toggle defaultOn={r.active} />
            </div>
          </div>
          {i < rows.length - 1 && <Divider />}
        </div>
      ))}
    </Card>
  );
};

// ── Section: Badge / chip set ──────────────────────────────────────────────

const ChipsSection = () => (
  <Card>
    <div className="flex items-center justify-between mb-6">
      <Label>04 / Badges</Label>
      <Label>Status System</Label>
    </div>
    <div className="flex flex-wrap gap-2">
      {[
        { l: "OG Verified", color: INK, bg: "transparent", border: true },
        { l: "Network School", color: PAPER, bg: INK },
        { l: "Whitelisted", color: INK, bg: CONCRETE },
        { l: "Pending Review", color: INK, bg: "transparent", border: true, dot: ACCENT },
        { l: "Builder", color: PAPER, bg: ACCENT },
        { l: "Recruiter", color: PAPER, bg: ACCENT },
      ].map((c: any) => (
        <span
          key={c.l}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
          style={{
            background: c.bg,
            color: c.color,
            border: c.border ? `1.5px solid ${BORDER}` : "none",
            fontFamily: SANS,
          }}
        >
          {c.dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.dot }} />}
          {c.l}
        </span>
      ))}
    </div>
  </Card>
);

// ── Section: Hero / Editorial header ───────────────────────────────────────

const HeroHeader = () => (
  <div className="px-6 md:px-12 pt-12 md:pt-20 pb-12">
    <div className="flex items-center justify-between mb-12">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full" style={{ background: ACCENT }} />
        <Label>Arubaito / Aesthetics Lab</Label>
      </div>
      <div className="flex items-center gap-6">
        <Link to="/careers" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }} className="uppercase tracking-widest">
          ← Careers
        </Link>
        <Link to="/" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }} className="uppercase tracking-widest">
          Home
        </Link>
      </div>
    </div>

    <div className="grid grid-cols-12 gap-6 items-end">
      <div className="col-span-12 md:col-span-8">
        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: "clamp(48px, 8vw, 112px)",
            lineHeight: 0.92,
            letterSpacing: "-0.045em",
            color: INK,
            fontWeight: 500,
          }}
        >
          A private operating
          <br />
          system for elite
          <br />
          <span style={{ color: MUTED }}>Web3 builders.</span>
        </h1>
      </div>
      <div className="col-span-12 md:col-span-4">
        <div style={{ fontFamily: SANS, fontSize: 14, color: GRAPHITE, lineHeight: 1.55, maxWidth: 320 }}>
          A live exploration of the neo-minimalist industrial direction — Braun, Teenage Engineering, Nothing OS, MUJI. Tap, toggle, and stress-test surfaces before rolling them out platform-wide.
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button
            className="px-5 py-2.5 rounded-full text-sm"
            style={{ background: INK, color: CREAM, fontFamily: SANS }}
          >
            Approve direction
          </button>
          <button
            className="inline-flex items-center gap-1 px-5 py-2.5 rounded-full text-sm"
            style={{ border: `1.5px solid ${INK}`, color: INK, fontFamily: SANS }}
          >
            Iterate <ArrowUpRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Page ────────────────────────────────────────────────────────────────────

export default function Aesthetics() {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: PAPER, color: INK, fontFamily: SANS }}
    >
      <HeroHeader />

      <div className="px-6 md:px-12 pb-24">
        {/* Metric strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <MetricTile label="Members" value="142" meta="+12 this week" accent={ACCENT} />
          <MetricTile label="Open Roles" value="07" meta="3 commission" accent={ACCENT} />
          <MetricTile label="Treasury" value="12.8" unit="SOL" meta="+1.6% / 30d" accent={ACCENT} />
          <MetricTile label="Vetting Queue" value="23" meta="Avg 2.4 days" accent={MUTED} />
        </div>

        {/* Hero grid: editorial + chart + radial */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <LineGraph />
          </div>
          <RadialIndicator />
        </div>

        {/* Streak + Profile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StreakCard />
          <ProfileCard />
        </div>

        {/* Controls + Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <ButtonsSection />
          <InputsSection />
        </div>

        {/* List + Chips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <ListRows />
          <ChipsSection />
        </div>

        {/* Color & type palette */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <Label>05 / Palette</Label>
            <Label>Tokens</Label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "Cream", hex: CREAM },
              { name: "Paper", hex: PAPER },
              { name: "Surface", hex: SURFACE },
              { name: "Concrete", hex: CONCRETE },
              { name: "Ink", hex: INK },
              { name: "Graphite", hex: GRAPHITE },
              { name: "Accent", hex: ACCENT },
              { name: "Border", hex: "#181818" },
            ].map((s) => (
              <div key={s.name}>
                <div
                  className="h-20 rounded-[14px]"
                  style={{ background: s.hex, border: `1.5px solid ${BORDER}` }}
                />
                <div className="mt-2 flex justify-between">
                  <span style={{ fontFamily: SANS, fontSize: 12, color: INK }}>{s.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{s.hex}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Label>Display / Editorial</Label>
              <div
                className="mt-3"
                style={{ fontFamily: DISPLAY, fontSize: 64, lineHeight: 0.95, letterSpacing: "-0.04em", color: INK, fontWeight: 500 }}
              >
                Aa Bb Cc
              </div>
              <div className="mt-2" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                Styrene A Trial · Display · tight tracking
              </div>
            </div>
            <div>
              <Label>Body / Micro</Label>
              <div className="mt-3" style={{ fontFamily: SANS, fontSize: 16, color: INK, lineHeight: 1.5 }}>
                Curated, intelligent, calm. A private members network for elite Web3 builders and AI agents.
              </div>
              <div className="mt-3" style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: "0.18em" }}>
                UPPERCASE · MICRO LABELS · MONO
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-12 flex items-center justify-between">
          <Label>Arubaito · Aesthetics Lab · v0.1</Label>
          <Label>Last update {new Date().toLocaleDateString()}</Label>
        </div>
      </div>
    </div>
  );
}
