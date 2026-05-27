import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { TextRotator } from "@/components/TextRotator";
import { WaitlistCountdownAesthetic as WaitlistCountdown } from "@/components/home/WaitlistCountdownAesthetic";
import { TreasuryDisplayAesthetic as TreasuryDisplay } from "@/components/home/TreasuryDisplayAesthetic";
import { VideoHeroAesthetic as VideoHeroSection } from "@/components/home/VideoHeroAesthetic";
import { MemberSliderAesthetic as MemberSlider } from "@/components/home/MemberSliderAesthetic";
import arubaitoLogo from "@/assets/arubaito-logo-black.png";
import reiLogoEye from "@/assets/rei-logo-eye.png";
import reiButton from "@/assets/rei-button.png";
import zkprofButton from "@/assets/zkprof-button.png";
import ubiButton from "@/assets/ubi-button.png";
import perksButton from "@/assets/perks-button.png";
import ikigaiSample from "@/assets/ikigai-card-sample.png";

// ── Aesthetics theme tokens (mirrored from /aesthetics) ───────────────────
const CREAM = "#faf1e1";
const PAPER = "#f5ead7";
const SURFACE = "#efe2c9";
const CONCRETE = "#e3d4b6";
const INK = "#181818";
const GRAPHITE = "#2a2a2a";
const MUTED = "rgba(24,24,24,0.55)";
const BORDER = "rgba(24,24,24,0.18)";
const ACCENT = "#ed565a";

const SANS = "'Consolas', 'IBM Plex Mono', monospace";
const DISPLAY = "'Styrene A Trial', 'Consolas', monospace";
const MONO = "'Consolas', 'IBM Plex Mono', monospace";

const Label = ({ children }: { children: React.ReactNode }) => (
  <span
    className="uppercase tracking-[0.18em]"
    style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}
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

const Index = () => {
  const navigate = useNavigate();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showManifesto, setShowManifesto] = useState(false);
  const tasksWords = ["Tasks", "Gigs", "Bounties"];
  const humansWords = ["AI", "Humans"];
  const companies = [
    "Binance","Coinbase","ConsenSys","Chainlink","Uniswap","Aave","Jupiter","Magic Eden","Phantom","Marinade Finance","Polygon","Avalanche","Near Protocol","Arbitrum","Optimism","StarkWare","Circle","Ledger","OpenSea","Animoca Brands","Messari","The Graph","dYdX","Helium","Drift Protocol","Mad Lads","Tensor","Saga Phone","Bonk","Myro","Pudgy Penguins","Azuki","Book of Meme","Pepe","Doodles",
  ];
  const jobTitles = [
    "Smart Contract Developers","Blockchain Engineers","Frontend Developers","Backend Developers","Full Stack Developers","Solidity Developers","Rust Developers","Protocol Engineers","Security Auditors","DevOps Engineers","Product Managers","Community Managers","Partnerships Managers","Growth Leads","Marketing Managers","UI/UX Designers","Governance Leads","DAO Coordinators","Research Analysts","Content Creators",
  ];

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ backgroundColor: PAPER, color: INK, fontFamily: SANS }}
    >
      {/* LEFT COLUMN - Static */}
      <div
        className="w-full lg:w-1/2 min-h-screen lg:h-screen lg:sticky lg:top-0 relative flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: PAPER }}
      >
        {/* Treasury - top left corner */}
        <div className="absolute top-4 left-4 z-50 hidden lg:block">
          <TreasuryDisplay />
        </div>

        {/* Waitlist - top right corner */}
        <div className="absolute top-4 right-4 z-50 hidden lg:block">
          <WaitlistCountdown />
        </div>

        {/* Logo - dead center */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <img
            src={hoveredButton === "rei" ? reiLogoEye : arubaitoLogo}
            alt={hoveredButton === "rei" ? "Rei" : "Arubaito"}
            className="h-24 md:h-32 w-auto transition-all duration-300"
            style={hoveredButton === "rei" ? { filter: "invert(1)" } : undefined}
          />
        </div>

        {/* Bottom-left text + buttons */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-4 z-10 w-full max-w-md px-0">
          <div className="w-full text-left">
            {hoveredButton === "rei" ? (
              <p
                className="text-sm md:text-base leading-relaxed"
                style={{ fontFamily: SANS, color: INK }}
              >
                <span>{"Aggregates "}</span>
                <span className="underline">
                  <TextRotator key="rei-tasks" words={tasksWords} isActive={true} color={ACCENT} pauseDuration={5000} />
                </span>
                <span>{" for "}</span>
                <span className="underline">
                  <TextRotator key="rei-humans-1" words={humansWords} isActive={true} delay={0} color={ACCENT} />
                </span>
                <span>{" hiring "}</span>
                <span className="underline">
                  <TextRotator key="rei-humans-2" words={humansWords} isActive={true} delay={1300} color={ACCENT} />
                </span>
                <br />
                <span className="text-xs mt-2 block" style={{ color: MUTED }}>
                  {"Rei will find you anything from Zealy Tasks to C-Level Roles. [ALaaAA]"}
                </span>
              </p>
            ) : (
              hoveredButton === null && (
                <p
                  className="text-sm md:text-base leading-relaxed"
                  style={{ fontFamily: SANS, color: INK }}
                >
                  <span style={{ color: ACCENT }}>{"Connecting"}</span>{" "}
                  <span className="underline">
                    <TextRotator
                      key="default-companies-1"
                      words={companies}
                      isActive={true}
                      delay={0}
                      color={INK}
                      startIndex={0}
                      pauseDuration={10000}
                    />
                  </span>{" "}
                  <span style={{ color: ACCENT }}>{"to"}</span>
                  <br />
                  <span style={{ color: ACCENT }}>{"Ex-"}</span>
                  <span className="underline">
                    <TextRotator
                      key="default-companies-2"
                      words={companies}
                      isActive={true}
                      delay={800}
                      color={INK}
                      startIndex={10}
                      pauseDuration={10000}
                    />
                  </span>{" "}
                  <span className="underline">
                    <TextRotator key="default-jobs" words={jobTitles} isActive={true} delay={1600} color={ACCENT} />
                  </span>
                  <br />
                  <span className="text-xs mt-2 block" style={{ color: MUTED }}>
                    {"Private Members Network Club"}
                  </span>
                </p>
              )
            )}
          </div>

          {/* Buttons — aesthetics pill style */}
          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={() => navigate("/arubaito")}
              className="flex-1 px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-80"
              style={{ background: INK, color: CREAM, fontFamily: SANS }}
            >
              Enter Club
            </button>
            <button
              onClick={() => window.open("https://rei.chat", "_blank")}
              onMouseEnter={() => setHoveredButton("rei")}
              onMouseLeave={() => setHoveredButton(null)}
              className="flex-1 px-5 py-2.5 rounded-full text-sm transition-colors"
              style={{
                background: "transparent",
                color: INK,
                border: `1.5px solid ${INK}`,
                fontFamily: SANS,
              }}
            >
              @AskRei
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Scrollable */}
      <div
        className="w-full lg:w-1/2 h-screen overflow-y-scroll snap-y snap-mandatory relative"
        style={{
          backgroundColor: CONCRETE,
          scrollSnapType: "y mandatory",
          scrollSnapStop: "always",
        }}
      >
        {/* Section 0 - Video Hero (kept) */}
        <VideoHeroSection
          onScrollDown={() =>
            document.getElementById("manifesto-section")?.scrollIntoView({ behavior: "smooth" })
          }
        />

        {/* Section 0.25 - Manifesto */}
        <div
          id="manifesto-section"
          className="h-screen flex-shrink-0 flex items-center justify-center px-8 md:px-16 lg:px-20 snap-start"
          style={{ backgroundColor: CONCRETE }}
        >
          <Card className="max-w-lg">
            <Label>Manifesto</Label>
            <div
              className="mt-4 text-justify"
              style={{ fontFamily: SANS, color: INK, fontSize: 14, lineHeight: 1.6 }}
            >
              <span>
                {"We've built an environment for teams to do meaningful work, because crypto is "}
                <strong style={{ color: ACCENT }}>{"hope"}</strong>{"."}
              </span>
              {!showManifesto && (
                <span
                  onClick={() => setShowManifesto(true)}
                  className="ml-2 cursor-pointer underline transition-opacity hover:opacity-100"
                  style={{ color: MUTED }}
                >
                  {"more"}
                </span>
              )}
              {showManifesto && (
                <>
                  <br /><br />
                  <span>
                    {"On the outside crypto looks like preposterous perps, memes with misdemeanours, prediction market moguls and rehypothicated token yield that makes 2008's MBS wrappers look like chewing gum wrappers. But the truth is, all the madness are merely expressions of freedom thanks to an economy born out of open blockchain finance. The "}
                    <strong style={{ color: ACCENT }}>{"hope"}</strong>
                    {" for the daughter of a farmer in a remote Filipino village can access the same yield as a Quant in a NYC skyscraper. Crypto's immutable rules means we can finally build societies on unshifting standards immune from regime shifts, insiders or majority holders. Helping builders in the crypto industry is what gives us "}
                    <strong style={{ color: ACCENT }}>{"meaning"}</strong>
                    {". We built Arubaito to support teams who are doing "}
                    <strong style={{ color: ACCENT }}>{"meaning"}</strong>
                    {"ful work."}
                  </span>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Section 0.3 - Features */}
        <section
          className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden py-20"
          style={{ backgroundColor: CONCRETE }}
        >
          <div className="container mx-auto px-8 lg:px-16">
            <div className="flex items-center justify-between mb-10 max-w-4xl mx-auto">
              <Label>01 / Features</Label>
              <Label>Platform</Label>
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { title: "CV Profile", subtitle: "Verified On-Chain" },
                { title: "Web3 Jobs", subtitle: "Bluechip Crypto Jobs" },
                { title: "Club", subtitle: "Events and Services" },
              ].map((step) => (
                <Card key={step.title}>
                  <Label>{step.title}</Label>
                  <div
                    className="mt-4"
                    style={{
                      fontFamily: DISPLAY,
                      fontSize: 28,
                      letterSpacing: "-0.03em",
                      color: INK,
                      lineHeight: 1.05,
                      fontWeight: 500,
                    }}
                  >
                    {step.subtitle}
                  </div>
                  <div className="mt-4 flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
                    <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>Live</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section 0.5 - Club Members Slider (kept, framed as inverted feature) */}
        <MemberSlider />

        {/* Section 1 - How To Join The Club */}
        <div
          id="how-club-works"
          className="h-screen flex-shrink-0 relative flex flex-col items-center justify-center snap-start overflow-hidden px-8"
          style={{ backgroundColor: CONCRETE }}
        >
          {/* Subtle ASCII background, low opacity so cream reads through */}
          <iframe
            src="/ascii/arubaito.html"
            className="absolute inset-0 w-full h-full border-0"
            style={{ backgroundColor: "transparent", opacity: 0.15, zIndex: 0 }}
            title="Arubaito ASCII Art"
          />

          <Card className="relative z-10 max-w-md w-full" inverted>
            <div className="flex items-center justify-between mb-6">
              <span
                className="uppercase tracking-[0.18em]"
                style={{ fontFamily: MONO, fontSize: 10, color: "rgba(239,226,201,0.55)" }}
              >
                02 / Membership
              </span>
              <span
                className="uppercase tracking-[0.18em]"
                style={{ fontFamily: MONO, fontSize: 10, color: "rgba(239,226,201,0.55)" }}
              >
                How To Join
              </span>
            </div>

            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: 32,
                letterSpacing: "-0.03em",
                color: SURFACE,
                lineHeight: 1.05,
                fontWeight: 500,
              }}
            >
              How to Signup
            </div>

            <div className="mt-6 flex flex-col gap-0" style={{ borderTop: `1.5px solid rgba(239,226,201,0.18)` }}>
              {[
                { n: "01", label: "Guest List" },
                { n: "02", label: "Membership NFT" },
                { n: "03", label: "CV Profile Score 80+" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-4"
                  style={{ borderBottom: `1.5px solid rgba(239,226,201,0.18)` }}
                >
                  <div className="flex items-center gap-4">
                    <span style={{ fontFamily: MONO, fontSize: 11, color: "rgba(239,226,201,0.55)" }}>
                      {item.n}
                    </span>
                    <span style={{ fontFamily: SANS, fontSize: 14, color: SURFACE }}>{item.label}</span>
                  </div>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/arubaito")}
              className="mt-6 px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-80"
              style={{ background: ACCENT, color: PAPER, fontFamily: SANS }}
            >
              Join Waitlist
            </button>
          </Card>
        </div>

        {/* Section 1.5 - Find Meaningful Work */}
        <div
          className="h-screen flex-shrink-0 relative snap-start overflow-hidden flex flex-col items-center justify-center px-8 py-12"
          style={{ backgroundColor: CONCRETE }}
        >
          <h2
            className="text-center mb-6 max-w-md"
            style={{
              fontFamily: DISPLAY,
              fontSize: 24,
              letterSpacing: "-0.02em",
              color: INK,
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            Find meaning, so that you can find meaningful work.
          </h2>
          <img
            src={ikigaiSample}
            alt="Ikigai Card"
            className="max-h-[55vh] w-auto object-contain rounded-2xl"
            style={{ border: `1.5px solid ${BORDER}` }}
          />
          <button
            onClick={() => navigate("/meaning")}
            className="mt-6 px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-80"
            style={{ background: INK, color: CREAM, fontFamily: SANS }}
          >
            Find It
          </button>
        </div>

        {/* Section 2 - Arubaito Apps Grid */}
        <div
          id="arubaito-apps"
          className="h-screen flex-shrink-0 flex flex-col items-center justify-center px-8 md:px-12 lg:px-16 py-16 snap-start"
          style={{ backgroundColor: CONCRETE }}
        >
          <div className="flex items-center justify-between mb-8 w-full max-w-md">
            <Label>03 / Suite</Label>
            <Label>Arubaito Apps</Label>
          </div>

          <Card className="w-full max-w-md">
            <div className="grid grid-cols-2 gap-4">
              <a
                href="https://arubaito.app/rei"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredButton("rei-app")}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <img
                  src={reiButton}
                  alt="REI"
                  className={`w-full h-auto rounded-2xl transition-opacity duration-300 ${hoveredButton === "rei-app" ? "opacity-50" : "opacity-100"}`}
                />
              </a>

              <a
                href="https://zkprof.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredButton("zkprof-app")}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <img
                  src={zkprofButton}
                  alt="zkPROF"
                  className={`w-full h-auto rounded-2xl transition-opacity duration-300 ${hoveredButton === "zkprof-app" ? "opacity-50" : "opacity-100"}`}
                />
              </a>

              <div className="relative cursor-not-allowed">
                <img src={ubiButton} alt="UBI" className="w-full h-auto rounded-2xl opacity-50" />
              </div>

              <div className="relative cursor-not-allowed">
                <img src={perksButton} alt="PERKS PRTCL" className="w-full h-auto rounded-2xl opacity-50" />
              </div>
            </div>

            <div className="h-12 mt-4 flex items-center justify-center">
              {hoveredButton === "rei-app" && (
                <p className="text-xs text-center" style={{ color: MUTED, fontFamily: SANS }}>
                  AI Agent Rei makes it easy to earn crypto by matching tasks &amp; bounties to your skills.
                </p>
              )}
              {hoveredButton === "zkprof-app" && (
                <p className="text-xs text-center" style={{ color: MUTED, fontFamily: SANS }}>
                  Dox Yourself Privately with zkProf. ZK-Snarks inspired by ZCash, built on Solana x402.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile: Show Treasury and Waitlist at top */}
      <div className="lg:hidden">
        <div className="fixed top-4 left-4 md:left-6 z-40">
          <TreasuryDisplay />
        </div>
        <div className="fixed top-4 right-4 md:right-6 z-50">
          <WaitlistCountdown />
        </div>
      </div>
    </div>
  );
};

export default Index;
