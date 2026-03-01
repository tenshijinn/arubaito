import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ClubMember {
  id: string;
  twitter_handle: string;
  profile_image_url: string | null;
  membership_type: string;
  cv_score: number | null;
  top_activities: Array<{ description?: string; chain?: string }>;
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

  // Auto-scroll every 5s
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
      <h2
        className="text-xl font-bold mb-10 font-mono tracking-widest"
        style={{ color: "hsl(var(--primary))" }}
      >
        CLUB MEMBERS
      </h2>

      <div className="relative w-full max-w-sm mx-auto">
        {/* Nav arrows */}
        <button
          onClick={scrollPrev}
          className="absolute -left-10 top-1/2 -translate-y-1/2 z-10 opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: "hsl(var(--primary))" }}
          aria-label="Previous member"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={scrollNext}
          className="absolute -right-10 top-1/2 -translate-y-1/2 z-10 opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: "hsl(var(--primary))" }}
          aria-label="Next member"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {members.map((member) => (
              <div
                key={member.id}
                className="min-w-0 shrink-0 grow-0 basis-full flex flex-col items-center px-4"
              >
                {/* Heading */}
                <p
                  className="text-xs font-mono tracking-[0.3em] mb-2 opacity-60"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  CLUB MEMBER
                </p>

                {/* CV Score */}
                {member.cv_score && (
                  <p
                    className="text-xs font-mono mb-4"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    CV Profile Score: {Math.round(member.cv_score)}/100
                  </p>
                )}

                {/* Membership type label */}
                <p
                  className="text-[10px] font-mono tracking-widest mb-3 uppercase opacity-40"
                  style={{ color: "#faf6f4" }}
                >
                  {member.membership_type
                    .split(",")
                    .map((t) =>
                      t === "whitelist"
                        ? "Verified"
                        : t === "nft"
                        ? "NFT Holder"
                        : "Top CV"
                    )
                    .join(" · ")}
                </p>

                {/* Avatar */}
                <div
                  className="w-24 h-24 rounded-full overflow-hidden mb-4"
                  style={{
                    border: "3px solid hsl(var(--primary))",
                    boxShadow: "0 0 20px hsl(358 79% 64% / 0.3)",
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
                      className="w-full h-full flex items-center justify-center font-mono text-2xl"
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
                  className="text-sm font-mono mb-4"
                  style={{ color: "#faf6f4" }}
                >
                  @{member.twitter_handle}
                </p>

                {/* Proof of Talent pills */}
                {member.top_activities.length > 0 && (
                  <div className="space-y-1.5">
                    <p
                      className="text-[10px] font-mono tracking-widest text-center opacity-40 mb-2"
                      style={{ color: "#faf6f4" }}
                    >
                      PROOF OF TALENT
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {member.top_activities.map((activity, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-2.5 py-1 rounded-full"
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

      {/* Member count */}
      <p
        className="text-[10px] font-mono mt-8 opacity-30"
        style={{ color: "#faf6f4" }}
      >
        {members.length} verified member{members.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
};
