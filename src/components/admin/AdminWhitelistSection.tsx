import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Loader2, Plus, UserPlus } from 'lucide-react';

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

interface AdminWhitelistSectionProps {
  adminHandle: string;
}

export function AdminWhitelistSection({ adminHandle }: AdminWhitelistSectionProps) {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [newHandle, setNewHandle] = useState('');
  const [newHandleNotes, setNewHandleNotes] = useState('');
  const [isAddingHandle, setIsAddingHandle] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

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
    } finally {
      setLoading(false);
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

      await logAdminAction(
        action === 'approve' ? 'APPROVE' : 'REJECT',
        'twitter_whitelist_submissions',
        submissionId,
        { status: 'pending' },
        { status: action === 'approve' ? 'approved' : 'rejected', notes: notes[submissionId] }
      );

      toast({
        title: action === 'approve' ? "Approved!" : "Rejected",
        description: data.dm_sent 
          ? "Submission processed and welcome DM sent"
          : `Submission ${action}ed successfully`,
      });

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

  const handleAddToWhitelist = async () => {
    if (!newHandle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Twitter handle",
        variant: "destructive",
      });
      return;
    }

    setIsAddingHandle(true);
    try {
      const cleanHandle = newHandle.trim().replace(/^@/, '');
      
      const { error } = await supabase
        .from('twitter_whitelist')
        .insert({
          twitter_handle: cleanHandle,
          verification_type: 'manual',
          notes: newHandleNotes.trim() || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already exists",
            description: `@${cleanHandle} is already on the whitelist`,
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        await logAdminAction('INSERT', 'twitter_whitelist', cleanHandle, null, {
          twitter_handle: cleanHandle,
          verification_type: 'manual',
          notes: newHandleNotes.trim() || null,
        });

        toast({
          title: "Added!",
          description: `@${cleanHandle} has been added to the whitelist`,
        });
        setNewHandle('');
        setNewHandleNotes('');
      }
    } catch (error: any) {
      console.error('Error adding to whitelist:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add to whitelist",
        variant: "destructive",
      });
    } finally {
      setIsAddingHandle(false);
    }
  };

  const logAdminAction = async (action: string, tableName: string, recordId: string, previousValue: any, newValue: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from('admin_audit_log').insert({
        admin_user_id: session.user.id,
        admin_handle: adminHandle,
        action,
        table_name: tableName,
        record_id: recordId,
        previous_value: previousValue,
        new_value: newValue,
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const processedSubmissions = submissions.filter(s => s.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Add to Whitelist Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add to Whitelist
          </CardTitle>
          <CardDescription>Manually add a Twitter handle to the whitelist</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Twitter handle (e.g. elonmusk)"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Notes (optional)"
                value={newHandleNotes}
                onChange={(e) => setNewHandleNotes(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleAddToWhitelist}
              disabled={isAddingHandle || !newHandle.trim()}
              className="sm:w-auto w-full"
            >
              {isAddingHandle ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add to Whitelist
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Submissions */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Pending Submissions ({pendingSubmissions.length})</h3>
        
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
        <h3 className="text-xl font-semibold mb-4">Processed Submissions ({processedSubmissions.length})</h3>
        
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
  );
}
