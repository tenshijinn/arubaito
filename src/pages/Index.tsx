import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { TextRotator } from "@/components/TextRotator";
import { WaitlistCountdown } from "@/components/WaitlistCountdown";
import { TreasuryDisplay } from "@/components/TreasuryDisplay";
import { VideoHeroSection } from "@/components/VideoHeroSection";
import arubaitoLogo from "@/assets/arubaito-logo.png";
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

const Index = () => {
  const navigate = useNavigate();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const tasksWords = ["Jobs", "Tasks", "Gigs", "Bounties"];
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
        backgroundColor: "hsl(var(--landing-bg))",
        backgroundImage: "url(/rei-hover.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "background-image 0.3s ease",
      };
    }
    return {
      backgroundColor: "hsl(var(--landing-bg))",
      transition: "background-image 0.3s ease",
    };
  };
  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row font-mono"
      style={{
        backgroundColor: "hsl(var(--landing-bg))",
      }}
    >
      {/* LEFT COLUMN - Static */}
      <div className="w-full lg:w-1/2 min-h-screen lg:h-screen lg:sticky lg:top-0 relative flex items-center justify-center overflow-hidden">
        {/* Background image for hover state */}
        {hoveredButton === "rei" && (
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: "url(/rei-hover.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}

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
          <img src={arubaitoLogo} alt="Arubaito" className="h-24 md:h-32 w-auto" />
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
                  color: "#faf6f4",
                }}
              >
                Aggregating Web3{" "}
                <span className="underline">
                  <TextRotator key="rei-tasks" words={tasksWords} isActive={true} />
                </span>{" "}
                for{" "}
                <span className="underline">
                  <TextRotator key="rei-humans-1" words={humansWords} isActive={true} delay={0} />
                </span>{" "}
                <span
                  style={{
                    color: "#ed565a",
                  }}
                >
                  hiring
                </span>{" "}
                <span className="underline">
                  <TextRotator key="rei-humans-2" words={humansWords} isActive={true} delay={1300} />
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
                    color: "#faf6f4",
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
                      color="#faf6f4"
                      startIndex={0}
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
                      color="#faf6f4"
                      startIndex={10}
                    />
                  </span>{" "}
                  <span className="underline">
                    <TextRotator key="default-jobs" words={jobTitles} isActive={true} delay={1600} color="#ed565a" />
                  </span>
                  <br />
                  <span className="text-xs mt-2 block">Private Member Club for Bluechip Buildrs in Web3</span>
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
              onClick={() => navigate("/rei")}
              variant="outline"
              size="sm"
              className="flex-1 text-xs px-3 py-2 bg-transparent border font-mono transition-all duration-300"
              style={{
                borderColor: "hsl(var(--landing-border))",
                color: "hsl(var(--landing-border))",
                fontFamily: "Consolas, monospace",
              }}
              onMouseEnter={(e) => {
                setHoveredButton("rei");
                e.currentTarget.style.backgroundColor = "#ed565a";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "#ed565a";
              }}
              onMouseLeave={(e) => {
                setHoveredButton(null);
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "hsl(var(--landing-border))";
                e.currentTarget.style.borderColor = "hsl(var(--landing-border))";
              }}
            >
              @AskRei
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Scrollable */}
      <div
        className="w-full lg:w-1/2 h-screen overflow-y-scroll snap-y snap-mandatory"
        style={{
          backgroundColor: "#181818",
          scrollSnapType: "y mandatory",
          scrollSnapStop: "always",
        }}
      >
        {/* Section 0 - Video Hero */}
        <VideoHeroSection
          onScrollDown={() => document.getElementById("latest-updates")?.scrollIntoView({ behavior: "smooth" })}
        />

        {/* Section 1 - Arubaito Apps Grid */}
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
                AI Agent 'Rei' makes it easy to earn crypto by matching tasks, bounties, etc to your skills.
              </p>
            )}
            {hoveredButton === "zkprof-app" && (
              <p className="text-sm font-mono text-center max-w-md px-4" style={{ color: "#ed565a" }}>
                Dox Yourself Privately with zkProf made with ZK-Snarks inspired by ZCash built with x402 on Solana
              </p>
            )}
          </div>

          <button
            className="mt-4 text-xs font-mono flex items-center gap-1 mx-auto hover:opacity-80 transition-opacity"
            style={{
              color: "#ed565a",
            }}
            onClick={() =>
              document.getElementById("how-club-works")?.scrollIntoView({
                behavior: "smooth",
              })
            }
          >
            How Arubaito Works ↓
          </button>
        </div>

        {/* Section 2 - How the Club Works */}
        <div
          id="how-club-works"
          className="h-screen flex-shrink-0 flex items-center justify-center px-8 md:px-12 lg:px-16 py-16 snap-start"
        >
          <div className="max-w-xl">
            {/* Arubaito ASCII Art Block - Moved above title */}
            <iframe
              src="/ascii/arubaito.html"
              className="w-full max-w-md aspect-square mx-auto mb-8 border-0"
              style={{
                backgroundColor: "transparent",
              }}
              title="Arubaito ASCII Art"
            />

            <h2
              className="text-3xl font-bold mb-6 font-mono text-left"
              style={{
                color: "#ed565a",
              }}
            >
              JOIN ARUBAITO CLUB BY
            </h2>

            <div
              className="grid grid-cols-2 gap-x-8 gap-y-3 font-mono text-left text-xs leading-tight mb-5"
              style={{
                color: "#ed565a",
              }}
            >
              <div className="flex items-start gap-2">
                <img src={reiUspX} alt="" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Bluechip X Verification</span>
              </div>

              <div className="flex items-start gap-2">
                <img src={clubUspNft} alt="" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Buy a Member NFT</span>
              </div>

              <div className="flex items-start gap-2">
                <img src={clubUspCv} alt="" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Score 80+ on your CV Profile</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => navigate("/arubaito")}
                size="sm"
                style={{
                  backgroundColor: "#ed565a",
                  color: "#fff",
                }}
                className="font-mono text-xs bg-transparent"
              >
                Join the Club
              </Button>
            </div>
          </div>
        </div>

        {/* Section 3 - How Rei Works */}
        <div className="h-screen flex-shrink-0 flex items-center justify-center px-8 md:px-12 lg:px-16 py-16 snap-start">
          <div className="max-w-xl">
            {/* Rei ASCII Art Block - Moved above title */}
            <iframe
              src="/ascii/rei.html"
              className="w-full max-w-md aspect-square mx-auto mb-8 border-0"
              style={{
                backgroundColor: "transparent",
              }}
              title="Rei ASCII Art"
            />

            <h2
              className="text-3xl font-bold mb-6 font-mono text-left"
              style={{
                color: "#ed565a",
              }}
            >
              How Rei Works
            </h2>

            <div
              className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-left text-xs leading-none mb-5"
              style={{
                color: "#ed565a",
              }}
            >
              <div className="flex items-center gap-2 whitespace-nowrap">
                <img src={reiUspAi} alt="" className="w-5 h-5 flex-shrink-0" />
                <span>Share Your Skills</span>
              </div>

              <div className="flex items-center gap-2 whitespace-nowrap">
                <img src={reiUspMatch} alt="" className="w-5 h-5 flex-shrink-0" />
                <span>Rei matches Jobs/Tasks to your skills</span>
              </div>

              <div className="flex items-center gap-2 whitespace-nowrap">
                <img src={reiUspX} alt="" className="w-5 h-5 flex-shrink-0" />
                <span>Type @AskRei on X to Chat</span>
              </div>

              <div className="flex items-center gap-2 whitespace-nowrap">
                <img src={reiUspSolana} alt="" className="w-5 h-5 flex-shrink-0" />
                <span>Use/Pay with x402 as a Human/AI Agent</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => navigate("/rei")}
                size="sm"
                style={{
                  backgroundColor: "#ed565a",
                  color: "#fff",
                }}
                className="font-mono text-xs bg-transparent"
              >
                Chat with Rei
              </Button>
            </div>
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
