import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Wallet, Link2, Globe, Layers } from "lucide-react";
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
            top_activities: Array.isArray(m.top_activities) ? m.top_activities : [],
          })) as ClubMember[]
        );
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (members.length === 0) return null;

  const proofIcons = [Wallet, Link2, Globe, Layers];

  return (
    <div
      className="h-screen flex-shrink-0 flex flex-col items-center justify-center px-8 md:px-12 lg:px-16 snap-start relative"
      style={{ backgroundColor: "#1A1A1A" }}
    >
      <div className="relative w-full max-w-[200px] mx-auto">
        {/* Nav arrows */}
        <button
          onClick={scrollPrev}
          className="absolute -left-12 top-1/2 -translate-y-1/2 z-10 opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: "#ED565A" }}
          aria-label="Previous member"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={scrollNext}
          className="absolute -right-12 top-1/2 -translate-y-1/2 z-10 opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: "#ED565A" }}
          aria-label="Next member"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {members.map((member) => (
              <div
                key={member.id}
                className="min-w-0 shrink-0 grow-0 basis-full flex justify-center"
              >
                {/* Card container */}
                <div
                  className="flex flex-col items-start w-full max-w-[200px]"
                  style={{
                    padding: "6px 6px 8px",
                    gap: "8px",
                    border: "1px solid #ED565A",
                    borderRadius: "16px",
                    background: "transparent",
                  }}
                >
                  {/* Image container */}
                  <div
                    className="w-full aspect-square overflow-hidden"
                    style={{
                      border: "1px solid #ED565A",
                      borderRadius: "14px",
                    }}
                  >
                    {member.profile_image_url ? (
                      <img
                        src={member.profile_image_url}
                        alt={`@${member.twitter_handle}`}
                        className="w-full h-full object-cover grayscale"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-mono text-4xl"
                        style={{ backgroundColor: "#141414", color: "#ED565A" }}
                      >
                        {member.twitter_handle.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content section */}
                  <div className="w-full px-0 flex flex-col gap-1.5">
                    {/* Name + Score row */}
                    <div className="flex items-start justify-between w-full">
                       <span
                        className="font-mono text-[10px] leading-4"
                        style={{ color: "#ED565A" }}
                      >
                        {member.job_title
                          ? member.twitter_handle
                              .replace(/([a-z])([A-Z])/g, "$1 $2")
                              .replace(/^./, (c) => c.toUpperCase())
                          : `@${member.twitter_handle}`}
                      </span>

                      {member.cv_score && (
                        <div className="flex flex-col items-end">
                          <span
                            className="font-mono text-[5px] tracking-[0.5px] leading-[8px]"
                            style={{ color: "#ED565A", opacity: 0.7 }}
                          >
                            CV PROFILE SCORE
                          </span>
                          <div className="flex items-baseline">
                            <span
                              className="font-mono font-bold text-[15px] leading-5"
                              style={{ color: "#ED565A" }}
                            >
                              {Math.round(member.cv_score)}
                            </span>
                            <span
                              className="font-mono text-[9px] leading-4"
                              style={{ color: "#ED565A", opacity: 0.5 }}
                            >
                              /100
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Handle with X icon */}
                    <a
                      href={`https://x.com/${member.twitter_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    >
                      <div
                        className="flex items-center justify-center w-4 h-4"
                        style={{
                          border: "1px solid #ED565A",
                          borderRadius: "5px",
                        }}
                      >
                        <svg width="8" height="8" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M8.33 5.93L13.53 0H12.3L7.78 5.15L4.17 0H0L5.45 7.78L0 14H1.23L5.99 8.56L9.83 14H14L8.33 5.93ZM6.62 7.85L6.07 7.08L1.68 0.91H3.58L7.11 5.89L7.66 6.66L12.3 13.13H10.4L6.62 7.85Z"
                            fill="#ED565A"
                          />
                        </svg>
                      </div>
                      <span
                        className="font-mono text-[7px] leading-3"
                        style={{ color: "#ED565A" }}
                      >
                        @{member.twitter_handle}
                      </span>
                    </a>

                    {/* Job title / bio */}
                    {member.job_title && (
                      <p
                        className="font-mono text-[7px] leading-[11px]"
                        style={{ color: "#ED565A" }}
                      >
                        {member.job_title}
                      </p>
                    )}

                    {/* Proof of Talent */}
                    {member.top_activities.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-0.5">
                        <span
                          className="font-mono text-[5px] tracking-[0.75px] leading-[8px]"
                          style={{ color: "#ED565A" }}
                        >
                          PROOF OF TALENT
                        </span>
                        <div className="flex items-center gap-1.5">
                          {member.top_activities.slice(0, 4).map((_, i) => {
                            const Icon = proofIcons[i % proofIcons.length];
                            return (
                              <div
                                key={i}
                                className="flex items-center justify-center"
                                style={{
                                  width: "23px",
                                  height: "23px",
                                  border: "1px solid #ED565A",
                                  borderRadius: "7px",
                                }}
                              >
                                <Icon
                                  className="w-2.5 h-2.5"
                                  style={{ color: "#ED565A" }}
                                  strokeWidth={1.67}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
