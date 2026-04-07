import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Clock, Search, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CommunitySubmission {
  id: string;
  title: string;
  description: string;
  link: string;
  submission_type: string;
  submitter_wallet: string;
  status: string;
  points_awarded: number | null;
  rejection_reason: string | null;
  created_at: string;
  og_image: string | null;
  compensation: string | null;
  role_tags: string[] | null;
}

interface AdminCommunitySectionProps {
  adminHandle: string;
}

export function AdminCommunitySection({ adminHandle }: AdminCommunitySectionProps) {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [pointsToAward, setPointsToAward] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('community_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch community submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    setProcessingId(submissionId);
    try {
      const points = pointsToAward[submissionId] || 100;
      
      const { error } = await supabase.functions.invoke('review-community-submission', {
        body: {
          submissionId,
          action: 'approve',
          points,
        },
      });

      if (error) throw error;

      await logAdminAction('UPDATE', 'community_submissions', submissionId, { status: 'pending' }, { status: 'approved', points_awarded: points });

      toast({
        title: "Approved!",
        description: `Submission approved with ${points} points`,
      });
      await fetchSubmissions();
    } catch (error: any) {
      console.error('Error approving submission:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve submission",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    setProcessingId(submissionId);
    try {
      const reason = rejectionReasons[submissionId] || 'Did not meet guidelines';
      
      const { error } = await supabase.functions.invoke('review-community-submission', {
        body: {
          submissionId,
          action: 'reject',
          rejectionReason: reason,
        },
      });

      if (error) throw error;

      await logAdminAction('UPDATE', 'community_submissions', submissionId, { status: 'pending' }, { status: 'rejected', rejection_reason: reason });

      toast({
        title: "Rejected",
        description: "Submission has been rejected",
      });
      await fetchSubmissions();
    } catch (error: any) {
      console.error('Error rejecting submission:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject submission",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
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
  const approvedSubmissions = submissions.filter(s => s.status === 'approved');
  const rejectedSubmissions = submissions.filter(s => s.status === 'rejected');

  const filteredSubmissions = (list: CommunitySubmission[]) =>
    list.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.submitter_wallet.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Community Submissions</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <div className="grid gap-4">
            {filteredSubmissions(pendingSubmissions).map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {submission.title}
                        <a href={submission.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      </CardTitle>
                      <CardDescription>
                        {submission.submission_type} • {submission.submitter_wallet.slice(0, 8)}...
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{submission.description}</p>
                  
                  {submission.role_tags && submission.role_tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {submission.role_tags.map((tag, i) => (
                        <Badge key={i} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Points"
                        className="w-24"
                        value={pointsToAward[submission.id] || 100}
                        onChange={(e) => setPointsToAward(prev => ({ ...prev, [submission.id]: parseInt(e.target.value) || 0 }))}
                      />
                      <Button
                        onClick={() => handleApprove(submission.id)}
                        disabled={processingId === submission.id}
                        size="sm"
                      >
                        {processingId === submission.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Approve
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        placeholder="Rejection reason"
                        value={rejectionReasons[submission.id] || ''}
                        onChange={(e) => setRejectionReasons(prev => ({ ...prev, [submission.id]: e.target.value }))}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleReject(submission.id)}
                        disabled={processingId === submission.id}
                        variant="destructive"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredSubmissions(pendingSubmissions).length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No pending submissions
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Submitter</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions(approvedSubmissions).map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        <a href={submission.link} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                          {submission.title}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </TableCell>
                      <TableCell>{submission.submission_type}</TableCell>
                      <TableCell>
                        <Badge variant="default">{submission.points_awarded || 0}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{submission.submitter_wallet.slice(0, 8)}...</TableCell>
                      <TableCell>{new Date(submission.created_at || '').toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions(rejectedSubmissions).map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.title}</TableCell>
                      <TableCell>{submission.submission_type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{submission.rejection_reason}</TableCell>
                      <TableCell>{new Date(submission.created_at || '').toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
