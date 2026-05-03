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
      };
    },
    staleTime: 1000 * 60 * 60 * 12,
    refetchOnWindowFocus: false,
  });

  const tweet = data?.latest_tweet;
  const tweetUrl = tweet ? `https://twitter.com/${data?.handle}/status/${tweet.id}` : `https://twitter.com/arubaito_app`;

  return (
    <div className="w-full h-full flex flex-col justify-between text-[#181818]" style={{ fontFamily: "Consolas, monospace" }}>
      <div className="flex items-center gap-1 text-[8px] font-bold tracking-wide mb-1">
        <XLogo className="h-3 w-3" />
        <span>@arubaito_app</span>
      </div>
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-[10px] leading-snug overflow-hidden line-clamp-5 hover:underline"
      >
        {tweet ? tweet.text : "Loading latest tweet…"}
      </a>
      <div className="flex justify-between text-[8px] font-bold mt-1 pt-1 border-t" style={{ borderColor: "#181818" }}>
        <span>{data?.followers ?? "—"} Followers</span>
        <span>{data?.tweet_count ?? "—"} Posts</span>
      </div>
    </div>
  );
};
