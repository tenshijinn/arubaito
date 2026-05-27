import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { TextRotator } from "@/components/TextRotator";
import { WaitlistCountdown } from "@/components/WaitlistCountdown";
import { TreasuryDisplay } from "@/components/TreasuryDisplay";
import { VideoHeroSection } from "@/components/VideoHeroSection";
import { MemberSlider } from "@/components/MemberSlider";
import arubaitoLogo from "@/assets/arubaito-logo.png";
import reiLogoEye from "@/assets/rei-logo-eye.png";
import reiUspAi from "@/assets/rei-usp-ai.png";
import reiUspMatch from "@/assets/rei-usp-match.png";
import reiUspX from "@/assets/rei-usp-x.png";
import reiUspSolana from "@/assets/rei-usp-solana.png";
import clubUspNft from "@/assets/club-usp-nft.png";
import clubUspCv from "@/assets/club-usp-cv.png";
import reiButton from "@/assets/rei-button.png";
import zkprofButton from "@/assets/zkprof-button.png";
import ubiButton from "@/assets/ubi-button.png";
import perksButton from "@/assets/perks-button.png";
import meaningfulBg from "@/assets/meaningful-bg-final.png";

const Index = () => {
  const navigate = useNavigate();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showManifesto, setShowManifesto] = useState(false);
  const tasksWords = ["Tasks", "Gigs", "Bounties"];
  const humansWords = ["AI", "Humans"];
  const companies = [
    "Binance",
    "Coinbase",
    "ConsenSys",
    "Chainlink",
    "Uniswap",
    "Aave",
    "Jupiter",
    "Magic Eden",
    "Phantom",
    "Marinade Finance",
    "Polygon",
    "Avalanche",
    "Near Protocol",
    "Arbitrum",
    "Optimism",
    "StarkWare",
    "Circle",
    "Ledger",
    "OpenSea",
    "Animoca Brands",
    "Messari",
    "The Graph",
    "dYdX",
    "Helium",
    "Drift Protocol",
    "Mad Lads",
    "Tensor",
    "Saga Phone",
    "Bonk",
    "Myro",
    "Pudgy Penguins",
    "Azuki",
    "Book of Meme",
    "Pepe",
    "Doodles",
  ];
  const jobTitles = [
    "Smart Contract Developers",
    "Blockchain Engineers",
    "Frontend Developers",
    "Backend Developers",
    "Full Stack Developers",
    "Solidity Developers",
    "Rust Developers",
    "Protocol Engineers",
    "Security Auditors",
    "DevOps Engineers",
    "Product Managers",
    "Community Managers",
    "Partnerships Managers",
    "Growth Leads",
    "Marketing Managers",
    "UI/UX Designers",
    "Governance Leads",
    "DAO Coordinators",
    "Research Analysts",
    "Content Creators",
  ];
  const getBackgroundStyle = () => {
    if (hoveredButton === "rei") {
      return {
        backgroundColor: "#faf1e1",
        backgroundImage: "url(/rei-hover.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "background-image 0.3s ease",
      };
    }
    return {
      backgroundColor: "#faf1e1",
      transition: "background-image 0.3s ease",
    };
  };
  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row font-mono"
      style={{
        backgroundColor: "#faf1e1",
      }}
    >
      {/* LEFT COLUMN - Static */}
      <div className="w-full lg:w-1/2 min-h-screen lg:h-screen lg:sticky lg:top-0 relative flex items-center justify-center overflow-hidden">

        {/* Treasury - top left corner */}
        <div className="absolute top-4 left-4 z-50 hidden lg:block">
          <TreasuryDisplay />
        </div>

        {/* Waitlist - top right corner */}
        <div className="absolute top-4 right-4 z-50 hidden lg:block">
          <WaitlistCountdown />
        </div>

        {/* Logo - dead center of left panel */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <img
            src={hoveredButton === "rei" ? reiLogoEye : arubaitoLogo}
            alt={hoveredButton === "rei" ? "Rei" : "Arubaito"}
            className="h-24 md:h-32 w-auto transition-all duration-300"
          />
        </div>

        {/* Text and buttons - bottom left corner */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-4 z-10 w-full max-w-md px-0">
          {/* Left aligned text with rotating words */}
          <div className="w-full text-left">
            {hoveredButton === "rei" ? (
              <p
                className="text-sm md:text-base font-mono leading-relaxed"
                style={{
                  fontFamily: "Consolas, monospace",
                  color: "#181818",
                }}
              >
                Aggregates{" "}
                <span className="underline">
                  <TextRotator key="rei-tasks" words={tasksWords} isActive={true} color="#ed565a" pauseDuration={5000} />
                </span>{" "}
                for{" "}
                <span className="underline">
                  <TextRotator key="rei-humans-1" words={humansWords} isActive={true} delay={0} color="#ed565a" />
                </span>{" "}
                hiring{" "}
                <span className="underline">
                  <TextRotator key="rei-humans-2" words={humansWords} isActive={true} delay={1300} color="#ed565a" />
                </span>
                <br />
                <span className="text-xs mt-2 block">
                  Rei will find you anything from Zealy Tasks to C-Level Roles. [ALaaAA]
                </span>
              </p>
            ) : (
              hoveredButton === null && (
                <p
                  className="text-sm md:text-base font-mono leading-relaxed"
                  style={{
                    fontFamily: "Consolas, monospace",
                    color: "#181818",
                  }}
                >
                  <span
                    style={{
                      color: "#ed565a",
                    }}
                  >
                    Connecting
                  </span>{" "}
                  <span className="underline">
                    <TextRotator
                      key="default-companies-1"
                      words={companies}
                      isActive={true}
                      delay={0}
                      color="#181818"
                      startIndex={0}
                      pauseDuration={10000}
                    />
                  </span>{" "}
                  <span
                    style={{
                      color: "#ed565a",
                    }}
                  >
                    to
                  </span>
                  <br />
                  <span
                    style={{
                      color: "#ed565a",
                    }}
                  >
                    Ex-
                  </span>
                  <span className="underline">
                    <TextRotator
                      key="default-companies-2"
                      words={companies}
                      isActive={true}
                      delay={800}
                      color="#181818"
                      startIndex={10}
                      pauseDuration={10000}
                    />
                  </span>{" "}
                  <span className="underline">
                    <TextRotator key="default-jobs" words={jobTitles} isActive={true} delay={1600} color="#ed565a" />
                  </span>
                  <br />
                  <span className="text-xs mt-2 block">Private Members Network Club</span>
                </p>
              )
            )}
          </div>

          {/* Buttons side by side */}
          <div className="flex gap-3 w-full max-w-xs">
            <Button
              onClick={() => navigate("/arubaito")}
              variant="outline"
              size="sm"
              className="flex-1 text-xs px-3 py-2 border font-mono transition-all duration-300"
              style={{
                backgroundColor: "#ed565a",
                borderColor: "#ed565a",
                color: "#181818",
                fontFamily: "Consolas, monospace",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#ed565a";
                e.currentTarget.style.borderColor = "#ed565a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ed565a";
                e.currentTarget.style.color = "#181818";
                e.currentTarget.style.borderColor = "#ed565a";
              }}
            >
              Enter Club
            </Button>
            <Button
              onClick={() => window.open("https://rei.chat", "_blank")}
              variant="outline"
              size="sm"
              className="flex-1 text-xs px-3 py-2 bg-transparent border font-mono transition-all duration-300"
              style={{
                borderColor: "#181818",
                color: "#181818",
                fontFamily: "Consolas, monospace",
              }}
              onMouseEnter={(e) => {
                setHoveredButton("rei");
                e.currentTarget.style.backgroundColor = "#ed565a";
                e.currentTarget.style.color = "#faf1e1";
                e.currentTarget.style.borderColor = "#ed565a";
              }}
              onMouseLeave={(e) => {
                setHoveredButton(null);
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#181818";
                e.currentTarget.style.borderColor = "#181818";
              }}
            >
              @AskRei
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Scrollable */}
      <div
        className="w-full lg:w-1/2 h-screen overflow-y-scroll snap-y snap-mandatory relative"
        style={{
          backgroundColor: "#faf1e1",
          scrollSnapType: "y mandatory",
          scrollSnapStop: "always",
        }}
      >
        {/* Hover overlay from @AskRei button */}
        {hoveredButton === "rei" && (
          <div
            className="absolute inset-0 z-50 pointer-events-none"
            style={{
              backgroundImage: "url(/rei-hover.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        {/* Section 0 - Video Hero */}
        <VideoHeroSection
          onScrollDown={() => document.getElementById("manifesto-section")?.scrollIntoView({ behavior: "smooth" })}
        />

        {/* Section 0.25 - Manifesto */}
        <div
          id="manifesto-section"
          className="h-screen flex-shrink-0 flex items-center justify-center px-8 md:px-16 lg:px-20 snap-start"
          style={{ backgroundColor: '#faf1e1' }}
        >
          <div className="max-w-lg" style={{ color: '#ed565a', textAlign: 'justify' }}>
            <div className="font-mono text-xs leading-relaxed text-justify md:text-lg">
              <span>{"We've built an environment for teams to do meaningful work, because crypto is "}<strong>{"hope"}</strong>{"."}</span>
              {!showManifesto && (
                <span
                  onClick={() => setShowManifesto(true)}
                  className="ml-2 cursor-pointer underline opacity-60 hover:opacity-100 transition-opacity"
                >
                  {"more"}
                </span>
              )}
              {showManifesto && (
                <>
                  <br /><br />
                  <span>{"On the outside crypto looks like preposterous perps, memes with misdemeanours, prediction market moguls and rehypothicated token yield that makes 2008's MBS wrappers look like chewing gum wrappers. But the truth is, all the madness are merely expressions of freedom thanks to an economy born out of open blockchain finance. The "}<strong>{"hope"}</strong>{" for the daughter of a farmer in a remote Filipino village can access the same yield as a Quant in a NYC skyscraper. Crypto's immutable rules means we can finally build societies on unshifting standards immune from regime shifts, insiders or majority holders. Helping builders in the crypto industry is what gives us "}<strong>{"meaning"}</strong>{". We built Arubaito to support teams who are doing "}<strong>{"meaning"}</strong>{"ful work."}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Section 0.3 - How it Works */}
        <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden py-20" style={{ backgroundColor: '#0a0a0a' }}>
          <div className="container mx-auto px-8 lg:px-16">
            <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] font-light text-center mb-16 font-mono" style={{ color: '#ed565a' }}>
              Features
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { title: 'CV Profile', subtitle: 'Verified\nOn-Chain' },
                { title: 'Web3 Jobs', subtitle: 'Bluechip  Crypto Jobs' },
                { title: 'Club', subtitle: 'Events and Services' },
              ].map((step, index) => (
                <div key={step.title} className="relative text-center flex flex-col items-center">
                  <div className="p-8 border-[0.5px] border-white/10 rounded-2xl hover:bg-white/5 transition-colors w-full" style={{ backgroundColor: '#141414' }}>
                    <h3 className="font-light font-mono mb-3 text-base" style={{ color: '#ed565a' }}>{step.title}</h3>
                    <p className="text-sm font-mono whitespace-pre-line" style={{ color: '#a33e41' }}>{step.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 0.5 - Club Members Slider */}
        <MemberSlider />

        {/* Section 1 - How the Club Works */}
        <div
          id="how-club-works"
          className="h-screen flex-shrink-0 relative flex flex-col items-center justify-center snap-start overflow-hidden"
        >
          {/* Full-screen ASCII background */}
          <iframe
            src="/ascii/arubaito.html"
            className="absolute inset-0 w-full h-full border-0"
            style={{ backgroundColor: "transparent", zIndex: 0 }}
            title="Arubaito ASCII Art"
          />

          {/* Content overlay */}
          <div className="relative z-10 flex flex-col items-center justify-center px-8">
            <h2 className="text-xl font-bold mb-8 font-mono tracking-widest" style={{ color: "#ed565a" }}>
              How To Join The Club
            </h2>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { icon: reiUspX, label: 'Guest List' },
                { icon: clubUspNft, label: 'Membership NFT' },
                { icon: clubUspCv, label: 'CV Profile Score 80+' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs"
                  style={{ backgroundColor: '#181818', color: '#ed565a' }}
                >
                  <img src={item.icon} alt="" className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => navigate("/arubaito")}
              size="sm"
              variant="outline"
              className="font-mono text-xs bg-transparent border"
              style={{
                borderColor: "#ed565a",
                color: "#ed565a",
              }}
            >
              Join Waitlist
            </Button>
          </div>
        </div>

        {/* Section 1.5 - Find Meaningful Work */}
        <div className="h-screen flex-shrink-0 relative snap-start overflow-hidden cursor-pointer" onClick={() => navigate("/meaning")}>
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/ikigai-bg.mp4" type="video/mp4" />
          </video>
          {/* Text overlay - positioned above the person's head */}
          <div className="absolute inset-0 flex flex-col items-center pt-[30%] md:pt-[28%]">
            <h2 className="font-mono font-normal text-xs md:text-base lg:text-xl tracking-wide">
              <span className="bg-[#181818] px-3 py-1" style={{ color: '#fff6d0' }}>
                find meaning<span className="line-through">ful</span> work
              </span>
            </h2>
            <Button
              onClick={(e) => { e.stopPropagation(); navigate("/meaning"); }}
              size="sm"
              variant="outline"
              className="font-mono text-xs border mt-4"
              style={{
                borderColor: "#fff6d0",
                backgroundColor: "#fff6d0",
                color: "#181818",
              }}
            >
              Find It
            </Button>
          </div>
        </div>

        {/* Section 2 - Arubaito Apps Grid */}
        <div
          id="arubaito-apps"
          className="h-screen flex-shrink-0 flex flex-col items-center justify-center px-8 md:px-12 lg:px-16 py-16 snap-start"
        >
          <h2 className="text-xl font-bold mb-8 font-mono tracking-widest" style={{ color: "#ed565a" }}>
            ARUBAITO APPS
          </h2>

          <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-md mx-auto">
            {/* REI Button - Active */}
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

            {/* zkPROF Button - Active */}
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

            {/* UBI Button - Inactive */}
            <div className="relative cursor-not-allowed">
              <img src={ubiButton} alt="UBI" className="w-full h-auto rounded-2xl opacity-60" />
            </div>

            {/* PERKS PRTCL Button - Inactive */}
            <div className="relative cursor-not-allowed">
              <img src={perksButton} alt="PERKS PRTCL" className="w-full h-auto rounded-2xl opacity-60" />
            </div>
          </div>

          {/* Hover explainer text */}
          <div className="h-16 mt-6 flex items-center justify-center">
            {hoveredButton === "rei-app" && (
              <p className="text-sm font-mono text-center max-w-md px-4" style={{ color: "#ed565a" }}>
                AI Agent Rei makes it easy to earn crypto by matching tasks & bounties to your skills.
              </p>
            )}
            {hoveredButton === "zkprof-app" && (
              <p className="text-sm font-mono text-center max-w-md px-4" style={{ color: "#ed565a" }}>
                Dox Yourself Privately with zkProf. Uses ZK-Snarks inspired by ZCash built on Solana x402.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Mobile: Show Treasury and Waitlist at top on mobile */}
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
