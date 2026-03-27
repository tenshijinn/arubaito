import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, GraduationCap, Diamond, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ClubMember {
  id: string;
  twitter_handle: string;
  profile_image_url: string | null;
  membership_type: string;
  cv_score: number | null;
  top_activities: Array<{ description?: string; chain?: string }>;
  job_title: string | null;
}

function getMembershipBadges(membershipType: string) {
  const badges: Array<{ label: string; icon: typeof GraduationCap; color: string }> = [];
  const types = membershipType.toLowerCase();
  
  if (types.includes("ns_member")) {
    badges.push({ label: "NS", icon: GraduationCap, color: "hsl(var(--primary))" });
  }
  if (types.includes("whitelist")) {
    badges.push({ label: "Bluechip", icon: Diamond, color: "#60a5fa" });
  }
  if (types.includes("cv_score")) {
    badges.push({ label: "CV Profile", icon: FileText, color: "#a78bfa" });
  }
  // Fallback if none matched
  if (badges.length === 0) {
    badges.push({ label: "Member", icon: Diamond, color: "hsl(var(--muted-foreground))" });
  }
  return badges;
}

export const MemberSlider = () => {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from("club_member_showcase")
        .select("*")
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        setMembers(
          data.map((m: Record<string, unknown>) => ({
            ...m,
            top_activities: Array.isArray(m.top_activities)
              ? m.top_activities
              : [],
          })) as ClubMember[]
        );
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (members.length === 0) return null;

  return (
    <div
      className="h-screen flex-shrink-0 flex flex-col items-center justify-center px-8 md:px-12 lg:px-16 snap-start relative"
      style={{ backgroundColor: "#181818" }}
    >
      <div className="relative w-full max-w-sm mx-auto">
        {/* Nav arrows */}
        <button
          onClick={scrollPrev}
          className="absolute -left-12 top-1/2 -translate-y-1/2 z-10 opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: "hsl(var(--primary))" }}
          aria-label="Previous member"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={scrollNext}
          className="absolute -right-12 top-1/2 -translate-y-1/2 z-10 opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: "hsl(var(--primary))" }}
          aria-label="Next member"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {members.map((member) => (
              <div
                key={member.id}
                className="min-w-0 shrink-0 grow-0 basis-full flex flex-col items-center px-4"
              >
                {/* CLUB MEMBER heading */}
                <p
                  className="text-2xl font-mono tracking-[0.3em] mb-2 font-bold text-center"
                  style={{ color: "#faf6f4" }}
                >
                  CLUB MEMBER
                </p>

                {/* Membership pathway badges */}
                <div className="flex flex-wrap justify-center gap-2 mb-2">
                  {getMembershipBadges(member.membership_type).map((badge, i) => {
                    const Icon = badge.icon;
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: "hsl(var(--muted))",
                          color: badge.color,
                          border: `1px solid ${badge.color}40`,
                        }}
                      >
                        <Icon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    );
                  })}
                </div>

                {/* CV Profile Score */}
                {member.cv_score && (
                  <p
                    className="text-xs font-mono mb-2 text-center"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    CV Profile Score{" "}
                    <span className="font-bold">{Math.round(member.cv_score)}/100</span>
                  </p>
                )}

                {/* Job title */}
                {member.job_title && (
                  <p
                    className="text-lg font-mono italic mb-6 text-center"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    {member.job_title}
                  </p>
                )}

                {/* Avatar */}
                <div
                  className="w-36 h-36 rounded-full overflow-hidden mb-5"
                  style={{
                    border: "3px solid hsl(var(--primary))",
                    boxShadow: "0 0 24px hsl(358 79% 64% / 0.3)",
                  }}
                >
                  {member.profile_image_url ? (
                    <img
                      src={member.profile_image_url}
                      alt={`@${member.twitter_handle}`}
                      className="w-full h-full object-cover"
                      style={{ filter: "grayscale(100%)" }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center font-mono text-3xl"
                      style={{
                        backgroundColor: "hsl(var(--muted))",
                        color: "hsl(var(--primary))",
                      }}
                    >
                      {member.twitter_handle.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Handle */}
                <p
                  className="text-base font-mono mb-6 text-center"
                  style={{ color: "#faf6f4" }}
                >
                  @{member.twitter_handle}
                </p>

                {/* Proof of Talent pills */}
                {member.top_activities.length > 0 && (
                  <div className="w-full space-y-2">
                    <p
                      className="text-[10px] font-mono tracking-widest uppercase text-center"
                      style={{ color: "hsl(var(--primary))", opacity: 0.7 }}
                    >
                      Proof of Talent
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {member.top_activities.map((activity, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-mono px-3 py-1.5 rounded-full"
                          style={{
                            backgroundColor: "hsl(var(--muted))",
                            color: "hsl(var(--primary))",
                            border: "1px solid hsl(var(--primary) / 0.3)",
                          }}
                        >
                          {activity.description ||
                            `${activity.chain || "On-chain"}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
