import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import arubaitoLogo from "@/assets/arubaito-logo.png";
import { TreasuryDisplay } from "@/components/TreasuryDisplay";
import { GitHubActivity } from "@/components/careers/GitHubActivity";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Job {
  id: string;
  title: string;
  pitch: string;
  role: string;
  image?: string;
  applications: number;
}

const PLACEHOLDER_JOBS: Job[] = [
  {
    id: "biz-dev-sales",
    title: "Business Development (Sales) for Web3 AI SaaS (Commission Only)",
    pitch:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    role:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.",
    applications: 12,
  },
  {
    id: "twitter-marketer",
    title: "Twitter Marketer",
    pitch: "Placeholder pitch — to be updated.",
    role: "Placeholder role description — to be updated.",
    applications: 0,
  },
  {
    id: "ops-manager",
    title: "Operations Manager",
    pitch: "Placeholder pitch — to be updated.",
    role: "Placeholder role description — to be updated.",
    applications: 0,
  },
];

const JobAccordion = ({
  job,
  isOpen,
  onToggle,
}: {
  job: Job;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const [telegram, setTelegram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [cv, setCv] = useState<File | null>(null);

  return (
    <div
      className="border rounded-3xl overflow-hidden transition-all"
      style={{ borderColor: "#ed565a", backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
        style={{ color: "#ed565a", fontFamily: "IBM Plex Mono, monospace" }}
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
        <span className="font-bold text-sm md:text-base">{job.title}</span>
      </button>

      {isOpen && (
        <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image */}
          <div
            className="rounded-2xl overflow-hidden border min-h-[280px] md:min-h-[400px] bg-cover bg-center"
            style={{
              borderColor: "#ed565a",
              backgroundImage: `url(https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=800&q=80)`,
            }}
          />

          {/* Details + Apply form */}
          <div className="space-y-4" style={{ fontFamily: "IBM Plex Mono, monospace", color: "#ed565a" }}>
            <div>
              <p className="text-xs font-bold mb-1">JOB PITCH</p>
              <p className="text-xs leading-relaxed opacity-90">{job.pitch}</p>
            </div>
            <div>
              <p className="text-xs font-bold mb-1">ROLE</p>
              <p className="text-xs leading-relaxed opacity-90">{job.role}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold">Telegram</label>
              <Input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username"
                className="font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-bold">Twitter</label>
                <Input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@username"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold">CV Upload</label>
                <label className="block">
                  <span className="block text-center py-2 px-3 rounded text-xs cursor-pointer truncate"
                    style={{ backgroundColor: "#ed565a", color: "#181818" }}>
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
                style={{ backgroundColor: "#faf1e1", color: "#181818" }}
                className="rounded-full px-6 hover:opacity-90"
              >
                Apply
              </Button>
              <span className="text-[10px] opacity-70">
                {job.applications} applications submitted
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

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: "#181818" }}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top sticky panel: 3 squares */}
        <div className="grid grid-cols-3 gap-3">
          {/* Logo */}
          <Link
            to="/"
            className="aspect-square rounded-2xl border flex items-center justify-center p-4"
            style={{ borderColor: "#ed565a", backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            <img src={arubaitoLogo} alt="Arubaito" className="max-w-full max-h-full object-contain" />
          </Link>

          {/* GitHub activity */}
          <div
            className="aspect-square rounded-2xl border p-3"
            style={{ borderColor: "#ed565a", backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            <GitHubActivity />
          </div>

          {/* Treasury */}
          <div
            className="aspect-square rounded-2xl border p-4 flex items-end"
            style={{ borderColor: "#ed565a", backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            <TreasuryDisplay />
          </div>
        </div>

        {/* Heading */}
        <div className="pt-2">
          <h1
            className="text-2xl md:text-3xl font-bold"
            style={{ color: "#faf1e1", fontFamily: "Styrene A Trial, sans-serif" }}
          >
            Careers
          </h1>
          <p
            className="text-xs opacity-70 mt-1"
            style={{ color: "#faf1e1", fontFamily: "Consolas, monospace" }}
          >
            Join the Arubaito team — Private Members Network Club.
          </p>
        </div>

        {/* Job dropdowns */}
        <div className="space-y-3">
          {PLACEHOLDER_JOBS.map((job) => (
            <JobAccordion
              key={job.id}
              job={job}
              isOpen={openId === job.id}
              onToggle={() => setOpenId(openId === job.id ? null : job.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Careers;
