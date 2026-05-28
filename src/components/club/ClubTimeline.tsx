import { useState } from "react";
import { CheckCircle2, Circle, Clock, X } from "lucide-react";

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
  details?: string;
}

const MONO = "'Consolas', 'IBM Plex Mono', monospace";
const DISPLAY = "'Styrene A Trial', 'Consolas', monospace";
const INK = "#181818";
const CREAM = "#faf1e1";
const MUTED = "rgba(24,24,24,0.55)";
const BORDER = "rgba(24,24,24,0.18)";

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: "1",
    date: "Q1 2025",
    title: "Platform launch",
    description: "Official launch of the exclusive member portal with core features",
    status: "completed",
    details:
      "Successfully onboarded initial cohort of verified Web3 talent. Established verification protocols and NFT minting system.",
  },
  {
    id: "2",
    date: "Q2 2025",
    title: "CV builder & job board",
    description: "Professional profile system and direct job matching",
    status: "current",
    details:
      "Members can now create comprehensive profiles and pitch directly to hiring companies. Enhanced matching algorithms connect talent with opportunities.",
  },
  {
    id: "3",
    date: "Q3 2025",
    title: "Reputation system",
    description: "On-chain reputation tracking and endorsements",
    status: "upcoming",
    details:
      "Introducing peer endorsements, project verification, and reputation scoring that travels with your wallet across the Web3 ecosystem.",
  },
  {
    id: "4",
    date: "Q4 2025",
    title: "DAO governance",
    description: "Member voting rights and platform governance",
    status: "upcoming",
    details:
      "Token-gated governance enabling members to vote on platform features, verification criteria, and treasury allocation.",
  },
  {
    id: "5",
    date: "Q1 2026",
    title: "Global expansion",
    description: "Multi-chain support and international partnerships",
    status: "upcoming",
    details:
      "Expanding to Ethereum, Base, and Polygon networks. Partnering with major Web3 companies for exclusive hiring access.",
  },
];

const statusLabel = (status: TimelineEvent["status"]) =>
  status === "completed" ? "Completed" : status === "current" ? "In progress" : "Upcoming";

const StatusIcon = ({ status }: { status: TimelineEvent["status"] }) => {
  if (status === "completed") return <CheckCircle2 className="h-5 w-5" style={{ color: INK }} strokeWidth={1.5} />;
  if (status === "current")
    return <Clock className="h-5 w-5 animate-pulse" style={{ color: INK }} strokeWidth={1.5} />;
  return <Circle className="h-5 w-5" style={{ color: MUTED }} strokeWidth={1.5} />;
};

const StatusPill = ({ status }: { status: TimelineEvent["status"] }) => (
  <span
    className="uppercase px-3 py-1 rounded-full"
    style={{
      fontFamily: MONO,
      fontSize: 9,
      letterSpacing: "0.18em",
      color: status === "upcoming" ? MUTED : INK,
      border: `1.5px solid ${BORDER}`,
      background: "transparent",
    }}
  >
    {statusLabel(status)}
  </span>
);

export function ClubTimeline() {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  return (
    <div className="space-y-6">
      <div
        className="rounded-[20px] p-8"
        style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="uppercase" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}>
            {"03 / Roadmap"}
          </span>
          <span className="uppercase" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}>
            {"Membership"}
          </span>
        </div>
        <div className="mb-6">
          <h2 style={{ fontFamily: DISPLAY, fontSize: 24, letterSpacing: "-0.03em", color: INK, fontWeight: 500 }}>
            {"Membership roadmap"}
          </h2>
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
            {"Track our journey and upcoming milestones"}
          </p>
        </div>

        <div className="relative space-y-6 pl-8" style={{ borderLeft: `1.5px solid ${BORDER}` }}>
          {TIMELINE_EVENTS.map((event) => (
            <div key={event.id} className="relative">
              <div className="absolute -left-[42px] top-1" style={{ background: "#faf1e1", padding: "2px" }}>
                <StatusIcon status={event.status} />
              </div>
              <button
                onClick={() => setSelectedEvent(event)}
                className="w-full text-left rounded-[16px] p-5 transition-colors hover:bg-black/[0.03]"
                style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="space-y-1">
                    <p
                      className="uppercase"
                      style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
                    >
                      {event.date}
                    </p>
                    <h3
                      style={{
                        fontFamily: DISPLAY,
                        fontSize: 18,
                        letterSpacing: "-0.02em",
                        color: INK,
                        fontWeight: 500,
                      }}
                    >
                      {event.title}
                    </h3>
                  </div>
                  <StatusPill status={event.status} />
                </div>
                <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
                  {event.description}
                </p>
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <div
          className="rounded-[20px] p-8"
          style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-1">
              <p
                className="uppercase"
                style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
              >
                {selectedEvent.date}
              </p>
              <h3
                style={{ fontFamily: DISPLAY, fontSize: 22, letterSpacing: "-0.02em", color: INK, fontWeight: 500 }}
              >
                {selectedEvent.title}
              </h3>
            </div>
            <StatusPill status={selectedEvent.status} />
          </div>
          <p style={{ fontFamily: MONO, fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
            {selectedEvent.description}
          </p>
          {selectedEvent.details && (
            <div
              className="rounded-[14px] p-4 mt-4"
              style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
            >
              <p style={{ fontFamily: MONO, fontSize: 12, color: INK, lineHeight: 1.7 }}>
                {selectedEvent.details}
              </p>
            </div>
          )}
          <button
            onClick={() => setSelectedEvent(null)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-opacity hover:opacity-80"
            style={{ background: INK, color: CREAM, fontFamily: MONO }}
          >
            <X className="h-3.5 w-3.5" />
            {"Close details"}
          </button>
        </div>
      )}
    </div>
  );
}
