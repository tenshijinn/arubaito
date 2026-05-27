import { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Wallet, Link2, Globe, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NSIcon } from "@/components/icons/NSIcon";
import { GoldenCheckmark } from "@/components/icons/GoldenCheckmark";

interface ClubMember {
  id: string;
  twitter_handle: string;
  profile_image_url: string | null;
  membership_type: string;
  cv_score: number | null;
  top_activities: Array<{ description?: string; chain?: string }>;
  job_title: string | null;
}

const INK = "#181818";
const PAPER = "#f5ead7";
const CREAM = "#faf1e1";
const CONCRETE = "#e3d4b6";
const FEATURE_TEXT = "#efe2c9";
const FEATURE_SUB = "#f5ead7";
const FEATURE_MUTED = "rgba(239,226,201,0.55)";
const FEATURE_BORDER = "rgba(239,226,201,0.18)";
const MUTED = "rgba(24,24,24,0.55)";
const BORDER = "rgba(24,24,24,0.18)";
const ACCENT = "#ed565a";
const MONO = "'Consolas', 'IBM Plex Mono', monospace";

const getMemberBadges = (type: string) => {
  const types = type.toLowerCase().split(",").map((t) => t.trim());
  const badges: Array<{ key: string; label: string }> = [];
  if (types.some((t) => t.includes("ns_member") || t.includes("network_school"))) {
    badges.push({ key: "ns", label: "NS" });
  }
  if (types.some((t) => t.includes("whitelist") || t.includes("guestlist") || t.includes("bluechip"))) {
    badges.push({ key: "guestlist", label: "OG" });
  }
  return badges;
};

const proofIcons = [Wallet, Link2, Globe, Layers];
const proofLabels = ["Wallet Activity", "On-Chain Links", "Multi-Chain", "DeFi & Staking"];

export const MemberSliderAesthetic = () => {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hoveredProof, setHoveredProof] = useState<{ memberId: string; index: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("club_member_showcase")
        .select("*")
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        setMembers(
          data.map((m: Record<string, unknown>) => ({
            ...m,
            top_activities: Array.isArray(m.top_activities) ? m.top_activities : [],
          })) as ClubMember[]
        );
      }
    })();
  }, []);

  const startAuto = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => emblaApi?.scrollNext(), 5000);
  }, [emblaApi]);
  const stopAuto = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);
  useEffect(() => {
    if (!emblaApi) return;
    startAuto();
    return () => stopAuto();
  }, [emblaApi, startAuto, stopAuto]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (members.length === 0) return null;

  return (
    <div
      className="h-screen flex-shrink-0 flex items-center justify-center px-8 md:px-12 lg:px-16 snap-start relative"
      style={{ backgroundColor: CONCRETE }}
      onMouseEnter={stopAuto}
      onMouseLeave={startAuto}
    >
      <div className="flex flex-col md:flex-row items-center gap-10 z-10">
        <div className="relative w-full max-w-[320px]">
          <button
            onClick={scrollPrev}
            className="absolute -left-12 top-1/2 -translate-y-1/2 z-10 opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: INK }}
            aria-label="Previous member"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute -right-12 top-1/2 -translate-y-1/2 z-10 opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: INK }}
            aria-label="Next member"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {members.map((member) => {
                const badges = getMemberBadges(member.membership_type);
                const hasNS = badges.some((b) => b.key === "ns");
                const hasGuestlist = badges.some((b) => b.key === "guestlist");
                return (
                  <div key={member.id} className="min-w-0 shrink-0 grow-0 basis-full flex justify-center">
                    <div
                      className="flex flex-col items-start w-full max-w-[320px]"
                      style={{
                        padding: "10px 10px 13px",
                        gap: 16,
                        border: `1.5px solid ${FEATURE_BORDER}`,
                        borderRadius: 32,
                        background: INK,
                      }}
                    >
                      <div
                        className="w-full aspect-square overflow-hidden"
                        style={{ border: `1.5px solid ${FEATURE_BORDER}`, borderRadius: 28 }}
                      >
                        {member.profile_image_url ? (
                          <img
                            src={member.profile_image_url}
                            alt={`@${member.twitter_handle}`}
                            className="w-full h-full object-cover grayscale"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-4xl"
                            style={{ background: INK, color: FEATURE_TEXT, fontFamily: MONO }}
                          >
                            {member.twitter_handle.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="w-full flex flex-col gap-3 py-[5px] px-[5px]">
                        <div className="flex items-center gap-1.5">
                          {hasNS && <NSIcon size={26} />}
                          {hasGuestlist && <GoldenCheckmark size={21} />}
                          <span style={{ color: FEATURE_TEXT, fontFamily: MONO, fontSize: 18, lineHeight: "26px" }}>
                            {member.job_title
                              ? member.twitter_handle.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase())
                              : `@${member.twitter_handle}`}
                          </span>
                        </div>

                        <a
                          href={`https://x.com/${member.twitter_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          <div
                            className="flex items-center justify-center w-7 h-7"
                            style={{ border: `1.5px solid ${FEATURE_BORDER}`, borderRadius: 10 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path
                                d="M8.33 5.93L13.53 0H12.3L7.78 5.15L4.17 0H0L5.45 7.78L0 14H1.23L5.99 8.56L9.83 14H14L8.33 5.93ZM6.62 7.85L6.07 7.08L1.68 0.91H3.58L7.11 5.89L7.66 6.66L12.3 13.13H10.4L6.62 7.85Z"
                                fill={FEATURE_TEXT}
                              />
                            </svg>
                          </div>
                          <span style={{ color: FEATURE_TEXT, fontFamily: MONO, fontSize: 13 }}>
                            @{member.twitter_handle}
                          </span>
                        </a>

                        {member.job_title && (
                          <p style={{ color: FEATURE_SUB, fontFamily: MONO, fontSize: 13, lineHeight: "22px" }}>
                            {member.job_title}
                          </p>
                        )}

                        <div className="flex items-end justify-between mt-1">
                          {member.top_activities.length > 0 && (
                            <div className="flex flex-col gap-3">
                              <span
                                className="uppercase tracking-[0.18em]"
                                style={{ color: FEATURE_MUTED, fontFamily: MONO, fontSize: 10 }}
                              >
                                Proof of Talent
                              </span>
                              <div className="flex items-center gap-3">
                                {member.top_activities.slice(0, 4).map((activity, i) => {
                                  const Icon = proofIcons[i % proofIcons.length];
                                  const isHovered = hoveredProof?.memberId === member.id && hoveredProof?.index === i;
                                  return (
                                    <div
                                      key={i}
                                      className="relative"
                                      onMouseEnter={() => setHoveredProof({ memberId: member.id, index: i })}
                                      onMouseLeave={() => setHoveredProof(null)}
                                    >
                                      <div
                                        className="flex items-center justify-center cursor-pointer transition-all"
                                        style={{
                                          width: 44,
                                          height: 44,
                                          border: `1.5px solid ${isHovered ? ACCENT : FEATURE_BORDER}`,
                                          borderRadius: 14,
                                          background: isHovered ? "rgba(237,86,90,0.12)" : "transparent",
                                        }}
                                      >
                                        <Icon className="w-5 h-5" style={{ color: FEATURE_TEXT }} strokeWidth={1.67} />
                                      </div>
                                      {isHovered && (
                                        <div
                                          className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fade-in"
                                          style={{
                                            bottom: "calc(100% + 4px)",
                                            minWidth: 180,
                                            maxWidth: 220,
                                            padding: "10px 12px",
                                            background: INK,
                                            border: `1.5px solid ${FEATURE_BORDER}`,
                                            borderRadius: 12,
                                          }}
                                        >
                                          <div className="flex items-center gap-2 mb-1">
                                            <Icon className="w-4 h-4 shrink-0" style={{ color: FEATURE_TEXT }} strokeWidth={1.67} />
                                            <span style={{ color: FEATURE_TEXT, fontFamily: MONO, fontSize: 11, fontWeight: 700 }}>
                                              {proofLabels[i % proofLabels.length]}
                                            </span>
                                          </div>
                                          <p style={{ color: FEATURE_SUB, fontFamily: MONO, fontSize: 11, lineHeight: "16px" }}>
                                            {activity.description ||
                                              `${activity.chain ? `Experience on ${activity.chain}` : "Verified on-chain activity"}`}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {member.cv_score && (
                            <div className="flex flex-col items-end shrink-0">
                              <span
                                className="uppercase tracking-[0.12em]"
                                style={{ color: FEATURE_MUTED, fontFamily: MONO, fontSize: 9 }}
                              >
                                CV Score
                              </span>
                              <div className="flex items-baseline">
                                <span style={{ color: ACCENT, fontFamily: MONO, fontWeight: 700, fontSize: 30, lineHeight: "36px" }}>
                                  {Math.round(member.cv_score)}
                                </span>
                                <span style={{ color: FEATURE_MUTED, fontFamily: MONO, fontSize: 16 }}>
                                  /100
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center justify-center gap-4">
          <span
            className="uppercase tracking-[0.18em]"
            style={{ color: MUTED, fontFamily: MONO, fontSize: 10 }}
          >
            04 / Members
          </span>
          <h2
            style={{
              fontFamily: "'Styrene A Trial', 'Consolas', monospace",
              fontSize: 28,
              letterSpacing: "-0.03em",
              color: INK,
              fontWeight: 500,
            }}
          >
            Club Members
          </h2>
          <a
            href="/arubaito"
            className="px-5 py-2.5 rounded-full transition-opacity hover:opacity-80"
            style={{ background: INK, color: CREAM, fontFamily: MONO, fontSize: 13 }}
          >
            Join Club
          </a>
        </div>
      </div>
    </div>
  );
};
