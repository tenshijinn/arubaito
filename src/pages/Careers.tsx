import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Twitter, Linkedin } from "lucide-react";
import arubaitoLogo from "@/assets/arubaito-logo-black.png";
import reiCareersImg from "@/assets/rei-careers.png";
import { TreasuryDisplay } from "@/components/TreasuryDisplay";
import { GitHubActivity } from "@/components/careers/GitHubActivity";
import { TwitterPanel } from "@/components/careers/TwitterPanel";
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

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      resolve(r.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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
      let cv_base64: string | undefined;
      if (cv) cv_base64 = await fileToBase64(cv);

      const { error } = await supabase.functions.invoke("send-careers-application", {
        body: {
          job_id: job.id,
          job_title: job.title,
          telegram,
          twitter,
          cv_base64,
          cv_filename: cv?.name,
          cv_content_type: cv?.type,
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
              backgroundImage: `url(${job.image || "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=800&q=80"})`,
            }}
          />

          <div className="space-y-4" style={{ fontFamily: "Consolas, monospace", color: "#181818" }}>
            <div className="flex items-center gap-3">
              {job.twitter && (
                <a href={job.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {job.linkedin && (
                <a href={job.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
            </div>
            <div>
              <p className="text-xs font-bold mb-1">JOB PITCH</p>
              <p className="text-xs leading-relaxed whitespace-pre-line">{linkify(job.pitch)}</p>
            </div>
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
                className="font-mono text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold block">Twitter</label>
                <Input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@username"
                  className="font-mono text-xs h-9"
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
        className="fixed top-4 left-4 flex flex-col items-start gap-0.5 z-50"
      >
        <img src={arubaitoLogo} alt="Arubaito" className="h-8 w-auto object-contain" />
        <span
          className="text-[9px] tracking-wider uppercase"
          style={{ color: "#181818", fontFamily: "Consolas, monospace" }}
        >
          {"careers"}
        </span>
      </Link>

      <div className="max-w-4xl mx-auto space-y-6 pt-12">
        {/* Top panel — 3 boxes */}
        <div className="flex gap-3 items-stretch h-[160px]">
          <div
            className="flex-1 min-w-0 rounded-2xl border p-3 flex items-center justify-center overflow-hidden"
            style={{ borderColor: "#181818", backgroundColor: "transparent" }}
          >
            <div className="w-full h-full">
              <GitHubActivity />
            </div>
          </div>

          <div
            className="rounded-2xl border p-3 aspect-square h-full shrink-0 overflow-hidden"
            style={{ borderColor: "#181818", backgroundColor: "transparent" }}
          >
            <TwitterPanel />
          </div>

          <div
            className="rounded-2xl border flex items-center justify-center aspect-square h-full shrink-0"
            style={{ borderColor: "#181818", backgroundColor: "transparent" }}
          >
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
