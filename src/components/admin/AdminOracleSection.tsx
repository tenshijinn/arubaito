import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, MessageSquare, Bot, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface OracleStats {
  last24h: {
    processed: number;
    replied: number;
    jobQueries: number;
    taskQueries: number;
    rssItems: number;
  };
  last7d: {
    processed: number;
    replied: number;
    jobQueries: number;
    taskQueries: number;
    rssItems: number;
  };
}

interface ProcessedTweet {
  id: string;
  tweet_id: string;
  author_handle: string | null;
  tweet_text: string | null;
  intent: string | null;
  replied_at: string | null;
  reply_tweet_id: string | null;
  processed_at: string;
}

export function AdminOracleSection() {
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["oracle-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("oracle-tweet-tracker", {
        body: { action: "stats" },
      });
      if (error) throw error;
      return data as OracleStats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentTweets, isLoading: tweetsLoading } = useQuery({
    queryKey: ["recent-processed-tweets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oracle_processed_tweets")
        .select("*")
        .order("processed_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as ProcessedTweet[];
    },
  });

  const checkMentionsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ingest-rss-feeds", {
        body: { action: "ingest_mentions" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["oracle-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-processed-tweets"] });
      toast.success("Mentions check completed", {
        description: `Processed: ${data.result?.processed || 0}, Replied: ${data.result?.replied || 0}`,
      });
    },
    onError: (error) => {
      toast.error("Mentions check failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSettled: () => {
      setIsChecking(false);
    },
  });

  const handleCheckMentions = () => {
    setIsChecking(true);
    checkMentionsMutation.mutate();
  };

  const getIntentBadge = (intent: string | null) => {
    switch (intent) {
      case "job_query":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">Job Query</Badge>;
      case "task_query":
        return <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Task Query</Badge>;
      case "general":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">General</Badge>;
      case "irrelevant":
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/30">Irrelevant</Badge>;
      case "rate_limited":
        return <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">Rate Limited</Badge>;
      default:
        return <Badge variant="outline">{intent || "Unknown"}</Badge>;
    }
  };

  const StatCard = ({ title, value, description, icon: Icon }: { title: string; value: number; description: string; icon: any }) => (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (statsLoading || tweetsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">X Oracle (@AskRei_)</h2>
          <p className="text-muted-foreground">
            Monitor and manage X mention processing
          </p>
        </div>
        <Button
          onClick={handleCheckMentions}
          disabled={isChecking}
        >
          {isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Check Mentions Now
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Processed (24h)"
          value={stats?.last24h.processed || 0}
          description="Mentions analyzed"
          icon={MessageSquare}
        />
        <StatCard
          title="Replied (24h)"
          value={stats?.last24h.replied || 0}
          description="Public replies sent"
          icon={CheckCircle2}
        />
        <StatCard
          title="Job Queries (24h)"
          value={stats?.last24h.jobQueries || 0}
          description="Users asking about jobs"
          icon={TrendingUp}
        />
        <StatCard
          title="Task Queries (24h)"
          value={stats?.last24h.taskQueries || 0}
          description="Users asking about tasks"
          icon={Bot}
        />
      </div>

      {/* 7-day Summary */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">7-Day Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats?.last7d.processed || 0}</p>
              <p className="text-xs text-muted-foreground">Total Processed</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.last7d.replied || 0}</p>
              <p className="text-xs text-muted-foreground">Replies Sent</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.last7d.jobQueries || 0}</p>
              <p className="text-xs text-muted-foreground">Job Queries</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.last7d.taskQueries || 0}</p>
              <p className="text-xs text-muted-foreground">Task Queries</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats?.last7d.processed ? Math.round((stats.last7d.replied / stats.last7d.processed) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Reply Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Recent Processed Mentions</CardTitle>
          <CardDescription>Last 10 mentions from the @AskRei_ feed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTweets?.map((tweet) => (
              <div
                key={tweet.id}
                className="flex items-start justify-between p-4 rounded-lg bg-muted/30 border border-border/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      @{tweet.author_handle || "unknown"}
                    </span>
                    {getIntentBadge(tweet.intent)}
                    {tweet.replied_at && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Replied
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate max-w-lg">
                    {tweet.tweet_text || "No text available"}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(tweet.processed_at), { addSuffix: true })}
                    {tweet.reply_tweet_id && (
                      <>
                        <span>•</span>
                        <a
                          href={`https://x.com/AskRei_/status/${tweet.reply_tweet_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Reply
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(!recentTweets || recentTweets.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No processed mentions yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
