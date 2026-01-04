import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Rss, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface JobSourceConfig {
  url: string;
  target_table: string;
}

interface JobSource {
  id: string;
  name: string;
  type: string;
  config: JobSourceConfig;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string | null;
}

export function AdminFeedsSection() {
  const queryClient = useQueryClient();
  const [syncingFeed, setSyncingFeed] = useState<string | null>(null);

  const { data: sources, isLoading } = useQuery({
    queryKey: ["job-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_sources")
        .select("*")
        .eq("type", "rss")
        .order("name");

      if (error) throw error;
      // Parse the config JSON for each source
      return (data || []).map((source: any) => ({
        ...source,
        config: typeof source.config === 'string' ? JSON.parse(source.config) : source.config,
      })) as JobSource[];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (action: string) => {
      const { data, error } = await supabase.functions.invoke("ingest-rss-feeds", {
        body: { action },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, action) => {
      queryClient.invalidateQueries({ queryKey: ["job-sources"] });
      toast.success(`Feed sync completed`, {
        description: `Action: ${action}`,
      });
    },
    onError: (error) => {
      toast.error("Feed sync failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSettled: () => {
      setSyncingFeed(null);
    },
  });

  const handleSyncAll = () => {
    setSyncingFeed("all");
    syncMutation.mutate("ingest_all");
  };

  const handleSyncJobs = () => {
    setSyncingFeed("jobs");
    syncMutation.mutate("ingest_jobs");
  };

  const handleSyncMentions = () => {
    setSyncingFeed("mentions");
    syncMutation.mutate("ingest_mentions");
  };

  const getTargetBadge = (targetTable: string) => {
    switch (targetTable) {
      case "jobs":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">Jobs</Badge>;
      case "tasks":
        return <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Tasks</Badge>;
      case "mentions":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">Mentions</Badge>;
      default:
        return <Badge variant="outline">{targetTable}</Badge>;
    }
  };

  if (isLoading) {
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
          <h2 className="text-2xl font-bold">RSS Feed Sources</h2>
          <p className="text-muted-foreground">
            Manage RSS feeds for jobs, tasks, and X mentions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSyncJobs}
            disabled={syncMutation.isPending}
          >
            {syncingFeed === "jobs" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Jobs/Tasks
          </Button>
          <Button
            variant="outline"
            onClick={handleSyncMentions}
            disabled={syncMutation.isPending}
          >
            {syncingFeed === "mentions" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Mentions
          </Button>
          <Button
            onClick={handleSyncAll}
            disabled={syncMutation.isPending}
          >
            {syncingFeed === "all" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync All
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {sources?.map((source) => (
          <Card key={source.id} className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Rss className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{source.name}</CardTitle>
                    <CardDescription className="text-xs truncate max-w-md">
                      {source.config.url}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTargetBadge(source.config.target_table)}
                  {source.is_active ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {source.last_synced_at ? (
                    <span>
                      Last sync: {formatDistanceToNow(new Date(source.last_synced_at), { addSuffix: true })}
                    </span>
                  ) : (
                    <span>Never synced</span>
                  )}
                </div>
                {source.created_at && (
                  <>
                    <span>•</span>
                    <span>
                      Created: {format(new Date(source.created_at), "MMM d, yyyy")}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {(!sources || sources.length === 0) && (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-12 text-center">
              <Rss className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No RSS sources configured</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Cron Setup Instructions</CardTitle>
          <CardDescription>
            Use an external cron service to trigger automatic syncs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Set up cron jobs at <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">cron-job.org</a> (free tier available):
            </p>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs space-y-2">
              <p className="text-muted-foreground"># Jobs/Tasks sync (every 30 minutes)</p>
              <p className="break-all">
                POST https://hmdxufttehhpyyqoaosz.supabase.co/functions/v1/cron-trigger
              </p>
              <p className="text-muted-foreground mt-2"># Body:</p>
              <p>{`{"action": "ingest_jobs"}`}</p>
              <p className="text-muted-foreground mt-4"># Mentions sync (every 15 minutes)</p>
              <p className="break-all">
                POST https://hmdxufttehhpyyqoaosz.supabase.co/functions/v1/cron-trigger
              </p>
              <p className="text-muted-foreground mt-2"># Body:</p>
              <p>{`{"action": "ingest_mentions"}`}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
