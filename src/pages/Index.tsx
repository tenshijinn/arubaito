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
                  color: "#faf6f4",
                }}
              >
                Aggregates Web3{" "}
                <span className="underline">
                  <TextRotator key="rei-tasks" words={tasksWords} isActive={true} color="#ffa6ff" />
                </span>{" "}
                for{" "}
                <span className="underline">
                  <TextRotator key="rei-humans-1" words={humansWords} isActive={true} delay={0} color="#ffa6ff" />
                </span>{" "}
                hiring{" "}
                <span className="underline">
                  <TextRotator key="rei-humans-2" words={humansWords} isActive={true} delay={1300} color="#ffa6ff" />
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
                  <span className="text-xs mt-2 block">Private Members Network Club for Buidlers in Web3</span>
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
        className="w-full lg:w-1/2 h-screen overflow-y-scroll snap-y snap-mandatory relative"
        style={{
          backgroundColor: "#181818",
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
          onScrollDown={() => document.getElementById("how-club-works")?.scrollIntoView({ behavior: "smooth" })}
        />

        {/* Section 0.5 - Club Members Slider */}
        <MemberSlider />

        {/* Section 1 - How the Club Works */}
        <div
          id="how-club-works"
          className="h-screen flex-shrink-0 flex flex-col items-center justify-center px-8 md:px-12 lg:px-16 py-16 snap-start"
        >
          <h2 className="text-xl font-bold mb-8 font-mono tracking-widest" style={{ color: "#ed565a" }}>
            3 Ways to Join The Club
          </h2>

          <div className="max-w-md mx-auto">
            {/* Arubaito ASCII Art Block */}
            <iframe
              src="/ascii/arubaito.html"
              className="w-full aspect-square mb-6 border-0"
              style={{
                backgroundColor: "transparent",
              }}
              title="Arubaito ASCII Art"
            />

            <div
              className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-left text-xs leading-tight mb-6"
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
                <span>80+ Score on CV Profile</span>
              </div>
            </div>

            <div className="flex justify-center">
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
