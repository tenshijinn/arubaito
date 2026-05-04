import { useQuery } from "@tanstack/react-query";
import { XLogo } from "@/components/icons/XLogo";
import { supabase } from "@/integrations/supabase/client";

export const TwitterPanel = () => {
  const { data } = useQuery({
    queryKey: ["arubaito-twitter-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-arubaito-twitter-stats");
      if (error) throw error;
      return data as {
        handle: string;
        followers: number;
        tweet_count: number;
        latest_tweet: { id: string; text: string; created_at: string } | null;
        fetched_at?: string;
      };
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  const tweet = data?.latest_tweet;
  const tweetUrl = tweet ? `https://twitter.com/${data?.handle}/status/${tweet.id}` : `https://twitter.com/arubaito_app`;

  return (
    <div className="w-full h-full flex flex-col text-[#181818] min-w-0" style={{ fontFamily: "Consolas, monospace" }}>
      <div className="flex items-center gap-1 text-[8px] font-bold tracking-wide mb-1 min-w-0">
        <XLogo className="h-3 w-3 shrink-0" />
        <span className="truncate">@arubaito_app</span>
      </div>
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-h-0 overflow-y-auto text-[9px] md:text-[10px] leading-snug hover:underline pr-1 break-words"
      >
        {tweet ? tweet.text : "Latest post unavailable"}
      </a>
      <div className="flex justify-between gap-1 text-[7px] md:text-[8px] font-bold mt-1 pt-1 border-t" style={{ borderColor: "#181818" }}>
        <span className="truncate">{data?.followers ?? "—"} Flwrs</span>
        <span className="truncate">{data?.tweet_count ?? "—"} Posts</span>
      </div>
    </div>
  );
};
