import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Search, ExternalLink, Edit2, X, Check, Briefcase } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Job {
  id: string;
  title: string;
  description: string;
  company_name: string | null;
  compensation: string | null;
  link: string | null;
  role_tags: string[] | null;
  status: string | null;
  employer_wallet: string;
  created_at: string;
  source: string | null;
}

interface AdminJobsSectionProps {
  adminHandle: string;
}

export function AdminJobsSection({ adminHandle }: AdminJobsSectionProps) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company_name: '',
    compensation: '',
    link: '',
    status: 'active',
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      // Use a raw query to bypass RLS for admin view
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      company_name: job.company_name || '',
      compensation: job.compensation || '',
      link: job.link || '',
      status: job.status || 'active',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingJob) return;
    
    setIsSaving(true);
    try {
      const previousValue = { ...editingJob };
      
      const { error } = await supabase
        .from('jobs')
        .update({
          title: formData.title,
          description: formData.description,
          company_name: formData.company_name || null,
          compensation: formData.compensation || null,
          link: formData.link || null,
          status: formData.status,
        })
        .eq('id', editingJob.id);

      if (error) throw error;

      await logAdminAction('UPDATE', 'jobs', editingJob.id, previousValue, formData);

      toast({
        title: "Saved",
        description: "Job updated successfully",
      });
      setIsDialogOpen(false);
      setEditingJob(null);
      await fetchJobs();
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update job",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;

      await logAdminAction('UPDATE', 'jobs', jobId, { status: job?.status }, { status: newStatus });

      toast({
        title: "Status Updated",
        description: `Job status changed to ${newStatus}`,
      });
      await fetchJobs();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
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

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.employer_wallet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/20 text-green-500">Active</Badge>;
      case 'closed': return <Badge variant="secondary">Closed</Badge>;
      case 'expired': return <Badge variant="outline">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

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
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Briefcase className="w-6 h-6" />
          Jobs ({jobs.length})
        </h2>
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {job.title}
                      {job.link && (
                        <a href={job.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{job.company_name || '-'}</TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.source || 'manual'}</Badge>
                  </TableCell>
                  <TableCell>{new Date(job.created_at || '').toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(job)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Select
                        value={job.status || 'active'}
                        onValueChange={(value) => handleStatusChange(job.id, value)}
                      >
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredJobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No jobs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription>Update job details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Compensation</Label>
                <Input
                  value={formData.compensation}
                  onChange={(e) => setFormData(prev => ({ ...prev, compensation: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link</Label>
              <Input
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
