import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { CommunitySubmissionForm } from "@/components/CommunitySubmissionForm";
import { PointsDisplay } from "@/components/PointsDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Send } from "lucide-react";
import { WalletProvider } from "@/components/WalletProvider";

const CommunityContent = () => {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toString() || '';
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: submissions } = useQuery({
    queryKey: ['my-submissions', walletAddress, refreshKey],
    queryFn: async () => {
      if (!walletAddress) return [];

      const { data, error } = await supabase
        .from('community_submissions')
        .select('*')
        .eq('submitter_wallet', walletAddress)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        return [];
      }

      return data;
    },
    enabled: !!walletAddress,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }

      return data;
    },
  });

  const handleSubmissionSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Community Contributions</h1>
            <p className="text-xl text-muted-foreground">
              Submit job and task opportunities to earn rewards
            </p>
          </div>

          {!walletAddress ? (
            <Card className="p-12 text-center">
              <Send className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to start submitting opportunities and earning rewards
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <Tabs defaultValue="submit">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="submit">Submit Opportunity</TabsTrigger>
                    <TabsTrigger value="my-submissions">My Submissions ({submissions?.length || 0})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="submit" className="mt-6">
                    <CommunitySubmissionForm
                      walletAddress={walletAddress}
                      onSuccess={handleSubmissionSuccess}
                    />
                  </TabsContent>

                  <TabsContent value="my-submissions" className="mt-6 space-y-4">
                    {submissions && submissions.length > 0 ? (
                      submissions.map((submission) => (
                        <Card key={submission.id} className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <Badge variant={submission.submission_type === 'job' ? 'default' : 'secondary'}>
                                {submission.submission_type}
                              </Badge>
                              <Badge
                                className="ml-2"
                                variant={
                                  submission.status === 'approved' ? 'default' :
                                  submission.status === 'pending' ? 'secondary' :
                                  'destructive'
                                }
                              >
                                {submission.status}
                              </Badge>
                            </div>
                            {submission.points_awarded > 0 && (
                              <Badge variant="outline" className="text-green-500">
                                +{submission.points_awarded} points
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{submission.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {submission.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                            {submission.rejection_reason && (
                              <span className="text-destructive">{submission.rejection_reason}</span>
                            )}
                          </div>
                        </Card>
                      ))
                    ) : (
                      <Card className="p-12 text-center text-muted-foreground">
                        <p>No submissions yet. Submit your first opportunity to get started!</p>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-8">
                <PointsDisplay walletAddress={walletAddress} />

                {leaderboard && leaderboard.length > 0 && (
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-semibold">Top Contributors</h3>
                    </div>
                    <div className="space-y-3">
                      {leaderboard.map((user, index) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-orange-600 text-white' :
                              'bg-muted'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium truncate max-w-[150px]">
                                {user.wallet_address.slice(0, 4)}...{user.wallet_address.slice(-4)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold">{user.total_points}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Community = () => {
  return (
    <WalletProvider>
      <CommunityContent />
    </WalletProvider>
  );
};

export default Community;