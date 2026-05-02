import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Twitter, Linkedin } from "lucide-react";
import arubaitoLogo from "@/assets/arubaito-logo.png";
import reiCareersImg from "@/assets/rei-careers.png";
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
  twitter?: string;
  linkedin?: string;
  applications: number;
}

const PLACEHOLDER_JOBS: Job[] = [
  {
    id: "biz-dev-sales",
    title: "Business Development (Sales) for Role for 'Rei' (Commission Only)",
    pitch:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    role:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    image: reiCareersImg,
    twitter: "https://twitter.com/askrei",
    linkedin: "https://linkedin.com/company/arubaito",
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
      style={{ borderColor: "#ed565a", backgroundColor: "transparent" }}
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
          <div
            className="rounded-2xl overflow-hidden border min-h-[280px] md:min-h-[400px] bg-cover bg-center"
            style={{
              borderColor: "#ed565a",
              backgroundImage: `url(${job.image || "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=800&q=80"})`,
            }}
          />

          <div className="space-y-4" style={{ fontFamily: "IBM Plex Mono, monospace", color: "#ed565a" }}>
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
        {/* Top panel */}
        <div className="relative flex gap-3 items-stretch">
          {/* GitHub activity — wide rectangle extending all the way left */}
          <div
            className="flex-1 rounded-2xl border p-4 flex items-center justify-center"
            style={{ borderColor: "#ed565a", backgroundColor: "transparent", minHeight: 180 }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <GitHubActivity />
            </div>
          </div>

          {/* Treasury — square, dead center content */}
          <div
            className="rounded-2xl border flex items-center justify-center aspect-square"
            style={{ borderColor: "#ed565a", backgroundColor: "transparent", minHeight: 180 }}
          >
            <TreasuryDisplay />
          </div>

          {/* Logo (no box) overlaid top-left */}
          <Link
            to="/"
            className="absolute top-2 left-3 flex flex-col items-start gap-0.5 z-10"
          >
            <img src={arubaitoLogo} alt="Arubaito" className="h-8 w-auto object-contain" />
            <span
              className="text-[9px] tracking-wider uppercase"
              style={{ color: "#faf1e1", fontFamily: "Consolas, monospace" }}
            >
              {"careers"}
            </span>
          </Link>
        </div>


        {/* Job dropdowns */}
        <div className="space-y-3 pt-2">
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
