import { ChevronDown } from "lucide-react"
import { EffectScene } from "./effects/EffectScene"

export function AsciiHeroSection() {
  const scrollToNext = () => {
    document.getElementById("latest-updates")?.scrollIntoView({
      behavior: "smooth"
    })
  }

  return (
    <div className="h-screen w-full flex-shrink-0 snap-start relative" style={{ backgroundColor: "#181818" }}>
      {/* Full-screen ASCII Effect */}
      <div className="absolute inset-0">
        <EffectScene />
      </div>

      {/* Down arrow at bottom */}
      <button
        onClick={scrollToNext}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-[#ed565a] hover:opacity-80 transition-opacity animate-bounce"
        aria-label="Scroll to next section"
      >
        <ChevronDown className="w-8 h-8" />
      </button>
    </div>
  )
}
