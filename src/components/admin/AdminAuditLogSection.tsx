import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, History, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditLog {
  id: string;
  admin_user_id: string;
  admin_handle: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  previous_value: any;
  new_value: any;
  created_at: string;
}

export function AdminAuditLogSection() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.admin_handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT': return <Badge className="bg-green-500/20 text-green-500">INSERT</Badge>;
      case 'UPDATE': return <Badge className="bg-blue-500/20 text-blue-500">UPDATE</Badge>;
      case 'DELETE': return <Badge className="bg-red-500/20 text-red-500">DELETE</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
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
          <History className="w-6 h-6" />
          Audit Log ({logs.length})
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
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Record ID</TableHead>
                <TableHead className="w-[80px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.admin_handle ? `@${log.admin_handle}` : log.admin_user_id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.table_name}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.record_id?.slice(0, 8) || '-'}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                          <FileText className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Audit Log Details</DialogTitle>
                          <DialogDescription>
                            {log.action} on {log.table_name} at {new Date(log.created_at).toLocaleString()}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Previous Value</h4>
                            <ScrollArea className="h-40 rounded border p-3 bg-muted/30">
                              <pre className="text-xs font-mono whitespace-pre-wrap">
                                {JSON.stringify(log.previous_value, null, 2) || 'null'}
                              </pre>
                            </ScrollArea>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">New Value</h4>
                            <ScrollArea className="h-40 rounded border p-3 bg-muted/30">
                              <pre className="text-xs font-mono whitespace-pre-wrap">
                                {JSON.stringify(log.new_value, null, 2) || 'null'}
                              </pre>
                            </ScrollArea>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
