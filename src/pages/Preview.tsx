import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { ArrowLeft, Briefcase, Users, Zap, Star } from "lucide-react";

const Preview = () => {
  // Light mode colors
  const colors = {
    background: "#faf1e1",
    text: "#181818",
    accent: "#ed565a",
    cardBg: "#f5ead8",
    cardBgAlt: "#efe4d2",
    muted: "#666666",
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {/* Navigation Sample */}
      <header
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        style={{ backgroundColor: colors.background, borderBottom: `1px solid ${colors.accent}20` }}
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link to="/" className="flex items-center gap-2" style={{ color: colors.text }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-mono uppercase tracking-wider">Back to Site</span>
          </Link>
          <div className="flex items-center gap-8">
            <span className="font-mono uppercase tracking-wider text-sm" style={{ color: colors.text }}>Club</span>
            <span className="font-mono uppercase tracking-wider text-sm" style={{ color: colors.text }}>CV Profile</span>
          </div>
          <div className="w-8 h-8 rounded" style={{ backgroundColor: colors.accent }} />
        </div>
      </header>

      <main className="pt-24 px-6 pb-16 max-w-6xl mx-auto">
        {/* Color Palette Display */}
        <section className="mb-16">
          <h1 className="text-3xl font-mono uppercase tracking-wider mb-8" style={{ color: colors.text }}>
            Light Mode Preview
          </h1>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded border" style={{ backgroundColor: colors.background, borderColor: colors.text }} />
              <span className="text-xs font-mono">Background</span>
              <span className="text-xs font-mono" style={{ color: colors.muted }}>#faf1e1</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded" style={{ backgroundColor: colors.text }} />
              <span className="text-xs font-mono">Text</span>
              <span className="text-xs font-mono" style={{ color: colors.muted }}>#181818</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded" style={{ backgroundColor: colors.accent }} />
              <span className="text-xs font-mono">Accent</span>
              <span className="text-xs font-mono" style={{ color: colors.muted }}>#ed565a</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded border" style={{ backgroundColor: colors.cardBg, borderColor: colors.text + "20" }} />
              <span className="text-xs font-mono">Card BG</span>
              <span className="text-xs font-mono" style={{ color: colors.muted }}>#f5ead8</span>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-xl font-mono uppercase tracking-wider mb-6" style={{ color: colors.accent }}>
            Typography
          </h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-mono uppercase tracking-wider">Heading 1 - Main Title</h1>
            <h2 className="text-2xl font-mono uppercase tracking-wider">Heading 2 - Section Title</h2>
            <h3 className="text-lg font-mono uppercase tracking-wider">Heading 3 - Subsection</h3>
            <p className="font-mono leading-relaxed max-w-2xl">
              Body text example. This is how regular paragraph text would appear in the light mode.
              The warm cream background (#faf1e1) provides a softer reading experience compared to pure white,
              while the near-black text (#181818) maintains excellent readability.
            </p>
            <p className="font-mono text-sm" style={{ color: colors.muted }}>
              Muted text for secondary information and captions.
            </p>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-xl font-mono uppercase tracking-wider mb-6" style={{ color: colors.accent }}>
            Buttons
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              className="px-6 py-3 font-mono uppercase tracking-wider text-sm transition-opacity hover:opacity-80"
              style={{ backgroundColor: colors.accent, color: colors.background }}
            >
              Primary Button
            </button>
            <button
              className="px-6 py-3 font-mono uppercase tracking-wider text-sm border transition-opacity hover:opacity-80"
              style={{ borderColor: colors.accent, color: colors.accent, backgroundColor: "transparent" }}
            >
              Outline Button
            </button>
            <button
              className="px-6 py-3 font-mono uppercase tracking-wider text-sm border transition-opacity hover:opacity-80"
              style={{ borderColor: colors.text, color: colors.text, backgroundColor: "transparent" }}
            >
              Secondary Button
            </button>
            <button
              className="px-6 py-3 font-mono uppercase tracking-wider text-sm transition-opacity hover:opacity-80"
              style={{ backgroundColor: colors.text, color: colors.background }}
            >
              Dark Button
            </button>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-16">
          <h2 className="text-xl font-mono uppercase tracking-wider mb-6" style={{ color: colors.accent }}>
            Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="p-6 rounded"
              style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.text}10` }}
            >
              <Briefcase className="w-8 h-8 mb-4" style={{ color: colors.accent }} />
              <h3 className="font-mono uppercase tracking-wider mb-2">Find Work</h3>
              <p className="font-mono text-sm" style={{ color: colors.muted }}>
                Discover opportunities in Web3 matched to your skills.
              </p>
            </div>
            <div
              className="p-6 rounded"
              style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.text}10` }}
            >
              <Users className="w-8 h-8 mb-4" style={{ color: colors.accent }} />
              <h3 className="font-mono uppercase tracking-wider mb-2">Join Community</h3>
              <p className="font-mono text-sm" style={{ color: colors.muted }}>
                Connect with builders and changemakers.
              </p>
            </div>
            <div
              className="p-6 rounded"
              style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.text}10` }}
            >
              <Zap className="w-8 h-8 mb-4" style={{ color: colors.accent }} />
              <h3 className="font-mono uppercase tracking-wider mb-2">Earn Points</h3>
              <p className="font-mono text-sm" style={{ color: colors.muted }}>
                Contribute to the ecosystem and get rewarded.
              </p>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section className="mb-16">
          <h2 className="text-xl font-mono uppercase tracking-wider mb-6" style={{ color: colors.accent }}>
            Form Elements
          </h2>
          <div className="max-w-md space-y-4">
            <div>
              <label className="block font-mono text-sm uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 font-mono text-sm rounded outline-none"
                style={{
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.text}20`,
                  color: colors.text,
                }}
              />
            </div>
            <div>
              <label className="block font-mono text-sm uppercase tracking-wider mb-2">Message</label>
              <textarea
                placeholder="Your message..."
                rows={4}
                className="w-full px-4 py-3 font-mono text-sm rounded outline-none resize-none"
                style={{
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.text}20`,
                  color: colors.text,
                }}
              />
            </div>
            <button
              className="w-full px-6 py-3 font-mono uppercase tracking-wider text-sm transition-opacity hover:opacity-80"
              style={{ backgroundColor: colors.accent, color: colors.background }}
            >
              Submit
            </button>
          </div>
        </section>

        {/* Feature Section Sample */}
        <section className="mb-16">
          <h2 className="text-xl font-mono uppercase tracking-wider mb-6" style={{ color: colors.accent }}>
            Feature Section Sample
          </h2>
          <div
            className="p-8 rounded-lg"
            style={{ backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.accent}30` }}
          >
            <div className="flex items-start gap-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: colors.accent + "20" }}
              >
                <Star className="w-8 h-8" style={{ color: colors.accent }} />
              </div>
              <div>
                <h3 className="text-xl font-mono uppercase tracking-wider mb-3">On-Chain Verified Credentials</h3>
                <p className="font-mono leading-relaxed mb-4" style={{ color: colors.muted }}>
                  Your Web3 experience is verified through on-chain activity. Connect your wallet
                  and showcase your genuine participation in the ecosystem - from DeFi interactions
                  to DAO governance votes.
                </p>
                <button
                  className="px-4 py-2 font-mono uppercase tracking-wider text-sm"
                  style={{ backgroundColor: colors.accent, color: colors.background }}
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section>
          <h2 className="text-xl font-mono uppercase tracking-wider mb-6" style={{ color: colors.accent }}>
            Dark vs Light Comparison
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="p-6 rounded"
              style={{ backgroundColor: "#181818", color: "#faf1e1" }}
            >
              <h3 className="font-mono uppercase tracking-wider mb-2" style={{ color: "#ed565a" }}>Dark Mode (Current)</h3>
              <p className="font-mono text-sm opacity-80">
                Near-black background with warm cream text and coral accent.
              </p>
            </div>
            <div
              className="p-6 rounded"
              style={{ backgroundColor: colors.background, color: colors.text, border: `1px solid ${colors.text}20` }}
            >
              <h3 className="font-mono uppercase tracking-wider mb-2" style={{ color: colors.accent }}>Light Mode (New)</h3>
              <p className="font-mono text-sm" style={{ color: colors.muted }}>
                Warm cream background with near-black text and coral accent.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Preview;
