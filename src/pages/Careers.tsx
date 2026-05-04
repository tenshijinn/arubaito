import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Linkedin } from "lucide-react";
import { XLogo } from "@/components/icons/XLogo";
import arubaitoLogo from "@/assets/arubaito-logo-black.png";
import reiCareersImg from "@/assets/rei-real.jpeg";
import reiLogoSquare from "@/assets/rei-logo-square.png";
import reiAchievementsImg from "@/assets/rei-achievements.png";
import { TreasuryDisplay } from "@/components/TreasuryDisplay";
import { GitHubActivity } from "@/components/careers/GitHubActivity";
import { TwitterPanel } from "@/components/careers/TwitterPanel";
import solanaLogo from "@/assets/solana-logo-careers.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  pitch: string;
  role: string;
  image?: string;
  twitter?: string;
  linkedin?: string;
}

const REI_PITCH = `Arubaito is a mission-driven initiative built for meaningful work. All of its auxiliary products are designed to advance the core crypto ethos of decentralization, immutability, peer-to-peer networks, and a permissionless, borderless future.

We're seeking a high-agency BD (Sales) team for AI Platform Rei — a novel project shortlisted at Igynte (a Dubai accelerator) from over 3,000 global startups to a final 15, which presented at Dubai's Museum of the Future in collaboration with the Solana Foundation.

Rei Platform: https://rei.chat`;

const REI_ROLE = `You will be responsible for driving revenue to the Rei platform by helping crypto companies and projects to grow their communities by supporting their crypto token campaigns through Rei's SaaS packages. To facilitate this, you will execute Telegram outreach using our provided prospect lead lists to act as a strategic bridge between talent and opportunity.

This 100% commission-only role requires a signed partnership agreement to sell mid-to-high ticket packages ranging from $99 to $2500 at 50% commission.

Sales Page: https://rei.chat/joinrei

Core responsibilities include sourcing high-value partnerships with Web3 protocols and DAOs while building long-term relationships with founders and identifying growth opportunities across crypto-native ecosystems. For high performers committed to the long term, there is the opportunity to earn up to 0.10% equity.

This position is built for conviction-driven individuals who prioritise ownership and performance-based upside over the stability of a fixed salary.`;

const PLACEHOLDER_JOBS: Job[] = [
  {
    id: "biz-dev-rei",
    title: "Business Development (Sales) for Role for Web3 AI SaaS (Commission Only)",
    pitch: REI_PITCH,
    role: REI_ROLE,
    image: reiCareersImg,
    twitter: "https://twitter.com/askrei",
    linkedin: "https://linkedin.com/company/arubaito",
  },
  {
    id: "twitter-marketer",
    title: "Twitter Marketer",
    pitch: "Placeholder pitch — to be updated.",
    role: "Placeholder role description — to be updated.",
  },
  {
    id: "ops-manager",
    title: "Operations Manager",
    pitch: "Placeholder pitch — to be updated.",
    role: "Placeholder role description — to be updated.",
  },
];

const linkify = (text: string) => {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
        style={{ color: "#181818" }}
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const JobAccordion = ({
  job,
  isOpen,
  onToggle,
  count,
  onSubmitted,
}: {
  job: Job;
  isOpen: boolean;
  onToggle: () => void;
  count: number;
  onSubmitted: () => void;
}) => {
  const [telegram, setTelegram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleApply = async () => {
    if (!telegram && !twitter && !cv) {
      toast.error("Please provide at least one contact method or CV");
      return;
    }
    setSubmitting(true);
    try {
      let cv_path: string | undefined;
      let cv_filename: string | undefined;
      let cv_content_type: string | undefined;
      if (cv) {
        const safe = cv.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${job.id}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from("rei-contributor-files")
          .upload(path, cv, {
            contentType: cv.type || "application/octet-stream",
            upsert: false,
          });
        if (upErr) throw new Error(`CV upload failed: ${upErr.message}`);
        cv_path = path;
        cv_filename = cv.name;
        cv_content_type = cv.type;
      }

      const { error } = await supabase.functions.invoke("send-careers-application", {
        body: {
          job_id: job.id,
          job_title: job.title,
          telegram,
          twitter,
          cv_path,
          cv_filename,
          cv_content_type,
        },
      });
      if (error) throw error;
      toast.success("Application submitted!");
      setTelegram(""); setTwitter(""); setCv(null);
      onSubmitted();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="border rounded-3xl overflow-hidden transition-all"
      style={{ borderColor: "#181818", backgroundColor: "transparent" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
        style={{ color: "#181818", fontFamily: "Consolas, monospace" }}
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
        <span className="font-bold text-sm md:text-base">{job.title}</span>
      </button>

      {isOpen && (
        <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="rounded-2xl overflow-hidden border min-h-[280px] md:min-h-[400px] bg-cover bg-left"
            style={{
              borderColor: "#181818",
              backgroundColor: job.image ? undefined : "#181818",
              backgroundImage: job.image ? `url(${job.image})` : undefined,
            }}
          />

          <div className="space-y-4" style={{ fontFamily: "Consolas, monospace", color: "#181818" }}>
            <div className="flex items-center gap-3 flex-wrap">
              {job.id === "biz-dev-rei" && (
                <a href="https://rei.chat" target="_blank" rel="noopener noreferrer" aria-label="Rei">
                  <img src={reiLogoSquare} alt="Rei" className="h-4 w-4 object-contain rounded-sm" />
                </a>
              )}
              {job.twitter && (
                <a href={job.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="flex items-center gap-1">
                  <XLogo className="h-4 w-4" />
                </a>
              )}
              {job.id === "biz-dev-rei" && (
                <a
                  href="https://canva.link/yf07yh595jztqkj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline"
                  style={{ color: "#181818" }}
                >
                  {"Rei Deck"}
                </a>
              )}
              {job.linkedin && (
                <a href={job.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex items-center gap-1">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {job.id === "biz-dev-rei" && (
                <a
                  href="https://canva.link/olq20ck86uyyv4v"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline"
                  style={{ color: "#181818" }}
                >
                  {"Arubaito Deck"}
                </a>
              )}
            </div>
            <div>
              <p className="text-xs font-bold mb-1">JOB PITCH</p>
              <p className="text-xs leading-relaxed whitespace-pre-line">{linkify(job.pitch)}</p>
            </div>
            {job.id === "biz-dev-rei" && (
              <div>
                <p className="text-xs font-bold mb-2">ACHIEVEMENTS</p>
                <img
                  src={reiAchievementsImg}
                  alt="Achievements"
                  className="w-full h-auto"
                />
              </div>
            )}
            <div>
              <p className="text-xs font-bold mb-1">ROLE</p>
              <p className="text-xs leading-relaxed whitespace-pre-line">{linkify(job.role)}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold block">Telegram</label>
              <Input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username"
                className="font-mono text-xs h-9 bg-transparent border rounded-md placeholder:text-[#181818]/50"
                style={{ borderColor: "#181818", color: "#181818" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold block">Twitter</label>
                <Input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@username"
                  className="font-mono text-xs h-9 bg-transparent border rounded-md placeholder:text-[#181818]/50"
                  style={{ borderColor: "#181818", color: "#181818" }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold block">CV Upload</label>
                <label className="block">
                  <span
                    className="flex items-center justify-center h-9 px-3 rounded-md text-xs cursor-pointer truncate"
                    style={{ backgroundColor: "#181818", color: "#faf1e1" }}
                  >
                    {cv ? cv.name : "Browse"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setCv(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                onClick={handleApply}
                disabled={submitting}
                style={{ backgroundColor: "#ed565a", color: "#181818", border: "none" }}
                className="rounded-full px-6 hover:opacity-90 border-0"
              >
                {submitting ? "Submitting..." : "Apply"}
              </Button>
              <span className="text-[10px] opacity-70">
                {count} application{count === 1 ? "" : "s"} submitted
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Careers = () => {
  const [openId, setOpenId] = useState<string | null>(PLACEHOLDER_JOBS[0]?.id ?? null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const loadCounts = async () => {
    const next: Record<string, number> = {};
    await Promise.all(
      PLACEHOLDER_JOBS.map(async (j) => {
        const { count } = await supabase
          .from("careers_applications")
          .select("*", { count: "exact", head: true })
          .eq("job_id", j.id);
        next[j.id] = count || 0;
      })
    );
    setCounts(next);
  };

  useEffect(() => { loadCounts(); }, []);

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: "#ebe9e6" }}>
      {/* Logo + careers label, top-left of page */}
      <Link
        to="/"
        className="fixed top-4 left-4 flex flex-row items-center gap-2 z-50"
      >
        <img src={arubaitoLogo} alt="Arubaito" className="h-14 w-auto object-contain" />
        <span
          className="text-sm md:text-base tracking-wider uppercase font-bold"
          style={{ color: "#181818", fontFamily: "Consolas, monospace" }}
        >
          {"careers"}
        </span>
      </Link>

      <div className="max-w-4xl mx-auto space-y-6 pt-20 md:pt-12">
        {/* Top panel — 3 equal boxes */}
        <div
          className="grid items-stretch gap-2 md:gap-3"
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          <div
            className="min-w-0 h-[106px] md:h-auto md:aspect-square rounded-2xl border p-2 md:p-3 flex items-center justify-center overflow-hidden"
            style={{ borderColor: "#181818", backgroundColor: "transparent" }}
          >
            <div className="w-full h-full min-w-0 overflow-hidden">
              <GitHubActivity />
            </div>
          </div>

          <div
            className="min-w-0 h-[106px] md:h-auto md:aspect-square rounded-2xl border p-2 md:p-3 overflow-hidden"
            style={{ borderColor: "#181818", backgroundColor: "transparent" }}
          >
            <TwitterPanel />
          </div>

          <div
            className="min-w-0 h-[106px] md:h-auto md:aspect-square rounded-2xl border relative p-2 md:p-3 flex items-center justify-center overflow-hidden"
            style={{ borderColor: "#181818", backgroundColor: "transparent" }}
          >
            <img
              src={solanaLogo}
              alt="Solana"
              className="absolute top-2 left-2 h-3 w-3 object-contain"
            />
            <TreasuryDisplay />
          </div>
        </div>

        {/* Job dropdowns */}
        <div className="space-y-3 pt-2">
          {PLACEHOLDER_JOBS.map((job) => (
            <JobAccordion
              key={job.id}
              job={job}
              isOpen={openId === job.id}
              onToggle={() => setOpenId(openId === job.id ? null : job.id)}
              count={counts[job.id] || 0}
              onSubmitted={loadCounts}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Careers;
