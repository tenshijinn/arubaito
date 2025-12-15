import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
interface UpdateSlide {
  id: string;
  asciiSrc: string;
  title: string;
  subtitle: string;
  link?: string;
}
const updates: UpdateSlide[] = [
  {
    id: "x402",
    asciiSrc: "/ascii/x402.html",
    title: "Promote Jobs or Tasks",
    subtitle: "Pay with x402 or SolanaPay",
  },
  {
    id: "zkprof",
    asciiSrc: "/ascii/zkprof.html",
    title: "Dox Yourself Privately with zkProf",
    subtitle: "Designed with ZK-Snarks inspired by ZCash built on Solana",
    link: "https://zkprof.xyz",
  },
];
export const LatestUpdatesCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);
  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-play every 5 seconds
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);
  return (
    <div className="w-full flex flex-col items-center">
      {/* Carousel Container */}
      <div ref={emblaRef} className="overflow-hidden w-full max-w-md">
        <div className="flex">
          {updates.map((update) => (
            <div key={update.id} className="flex-[0_0_100%] min-w-0 flex flex-col items-center">
              {/* ASCII Art */}
              <iframe
                src={update.asciiSrc}
                className="w-full aspect-square mb-8 border-0"
                style={{
                  backgroundColor: "transparent",
                }}
                title={`${update.title} ASCII Art`}
              />

              {/* Content */}
              <div className="text-center space-y-3 px-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
                  <p
                    style={{
                      color: "#faf6f4",
                    }}
                    className="font-mono text-lg font-semibold"
                  >
                    {update.title}
                  </p>
                </div>
                <p
                  className="font-mono text-xs"
                  style={{
                    color: "#d0d0d0",
                  }}
                >
                  {update.subtitle}
                </p>
                {update.link && (
                  <a
                    href={update.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs font-mono hover:opacity-80 transition-opacity"
                    style={{
                      color: "#ed565a",
                    }}
                  >
                    Learn more →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="flex gap-2 mt-6">
        {updates.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              selectedIndex === index ? "w-6" : "opacity-40",
            )}
            style={{
              backgroundColor: selectedIndex === index ? "#ed565a" : "#faf6f4",
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
