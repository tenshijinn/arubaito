import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { WaitlistCountdown } from '@/components/WaitlistCountdown';
import { TreasuryDisplay } from '@/components/TreasuryDisplay';

interface Submission {
  id: string;
  twitter_handle: string;
  x_user_id: string | null;
  display_name: string | null;
  profile_image_url: string | null;
  status: string;
  submitted_at: string;
  dm_sent: boolean;
  notes: string | null;
}

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchSubmissions();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Access Denied",
          description: "Please log in to access the admin panel",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roles) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('twitter_whitelist_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch submissions",
        variant: "destructive",
      });
    }
  };

  const handleApproval = async (submissionId: string, action: 'approve' | 'reject') => {
    setProcessingId(submissionId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data, error } = await supabase.functions.invoke('approve-whitelist-submission', {
        body: {
          submissionId,
          action,
          notes: notes[submissionId] || null,
        },
      });

      if (error) throw error;

      toast({
        title: action === 'approve' ? "Approved!" : "Rejected",
        description: data.dm_sent 
          ? "Submission processed and welcome DM sent"
          : `Submission ${action}ed successfully`,
      });

      // Refresh submissions
      await fetchSubmissions();
      setNotes(prev => ({ ...prev, [submissionId]: '' }));
    } catch (error: any) {
      console.error('Error processing submission:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} submission`,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const processedSubmissions = submissions.filter(s => s.status !== 'pending');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage Twitter whitelist submissions</p>
        </div>

        {/* Pending Submissions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Pending Submissions ({pendingSubmissions.length})
          </h2>
          
          {pendingSubmissions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No pending submissions
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingSubmissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {submission.profile_image_url && (
                          <img
                            src={submission.profile_image_url}
                            alt={submission.display_name || submission.twitter_handle}
                            className="w-12 h-12 rounded-full"
                          />
                        )}
                        <div>
                          <CardTitle className="text-lg">
                            {submission.display_name || submission.twitter_handle}
                          </CardTitle>
                          <CardDescription>
                            @{submission.twitter_handle}
                          </CardDescription>
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Add notes (optional)..."
                      value={notes[submission.id] || ''}
                      onChange={(e) => setNotes(prev => ({ ...prev, [submission.id]: e.target.value }))}
                      className="resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproval(submission.id, 'approve')}
                        disabled={processingId === submission.id}
                        className="flex-1"
                        variant="default"
                      >
                        {processingId === submission.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Approve & Send DM
                      </Button>
                      <Button
                        onClick={() => handleApproval(submission.id, 'reject')}
                        disabled={processingId === submission.id}
                        className="flex-1"
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Processed Submissions */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Processed Submissions ({processedSubmissions.length})
          </h2>
          
          {processedSubmissions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No processed submissions yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {processedSubmissions.map((submission) => (
                <Card key={submission.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {submission.profile_image_url && (
                          <img
                            src={submission.profile_image_url}
                            alt={submission.display_name || submission.twitter_handle}
                            className="w-12 h-12 rounded-full"
                          />
                        )}
                        <div>
                          <CardTitle className="text-lg">
                            {submission.display_name || submission.twitter_handle}
                          </CardTitle>
                          <CardDescription>
                            @{submission.twitter_handle}
                          </CardDescription>
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={submission.status === 'approved' ? 'default' : 'destructive'}>
                          {submission.status === 'approved' ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {submission.status}
                        </Badge>
                        {submission.dm_sent && (
                          <Badge variant="outline" className="text-xs">
                            DM Sent
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {submission.notes && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {submission.notes}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <WaitlistCountdown />
      <TreasuryDisplay />
    </div>
  );
}
