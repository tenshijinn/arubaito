import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Coins, Plus, ArrowUpRight, ArrowDownRight, Edit2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserPoints {
  id: string;
  wallet_address: string;
  x_user_id: string | null;
  total_points: number | null;
  points_pending: number | null;
  lifetime_earnings_sol: number | null;
  created_at: string;
}

interface PointsTransaction {
  id: string;
  wallet_address: string;
  points: number;
  transaction_type: string;
  tx_signature: string | null;
  sol_amount: number | null;
  created_at: string;
}

interface AdminPointsSectionProps {
  adminHandle: string;
}

export function AdminPointsSection({ adminHandle }: AdminPointsSectionProps) {
  const { toast } = useToast();
  const [userPoints, setUserPoints] = useState<UserPoints[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserPoints | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    total_points: 0,
    points_pending: 0,
    adjustment_reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pointsRes, transactionsRes] = await Promise.all([
        supabase.from('user_points').select('*').order('total_points', { ascending: false }),
        supabase.from('points_transactions').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      if (pointsRes.error) throw pointsRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      setUserPoints(pointsRes.data || []);
      setTransactions(transactionsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch points data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserPoints) => {
    setEditingUser(user);
    setFormData({
      total_points: user.total_points || 0,
      points_pending: user.points_pending || 0,
      adjustment_reason: '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      const previousValue = { 
        total_points: editingUser.total_points, 
        points_pending: editingUser.points_pending 
      };
      
      const { error } = await supabase
        .from('user_points')
        .update({
          total_points: formData.total_points,
          points_pending: formData.points_pending,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      await logAdminAction('UPDATE', 'user_points', editingUser.id, previousValue, {
        total_points: formData.total_points,
        points_pending: formData.points_pending,
        reason: formData.adjustment_reason,
      });

      toast({
        title: "Saved",
        description: "Points updated successfully",
      });
      setIsDialogOpen(false);
      setEditingUser(null);
      await fetchData();
    } catch (error: any) {
      console.error('Error updating points:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update points",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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

  const filteredUserPoints = userPoints.filter(up =>
    up.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    up.x_user_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(tx =>
    tx.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.transaction_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPointsInSystem = userPoints.reduce((acc, up) => acc + (up.total_points || 0), 0);

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
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Coins className="w-6 h-6" />
            Points Management
          </h2>
          <p className="text-muted-foreground">
            Total points in system: <span className="font-mono font-bold">{totalPointsInSystem.toLocaleString()}</span>
          </p>
        </div>
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

      <Tabs defaultValue="balances" className="w-full">
        <TabsList>
          <TabsTrigger value="balances">User Balances ({userPoints.length})</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallet</TableHead>
                    <TableHead>X User ID</TableHead>
                    <TableHead>Total Points</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Lifetime SOL</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUserPoints.map((up) => (
                    <TableRow key={up.id}>
                      <TableCell className="font-mono text-xs">{up.wallet_address.slice(0, 8)}...</TableCell>
                      <TableCell className="text-xs">{up.x_user_id || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="default">{(up.total_points || 0).toLocaleString()}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{(up.points_pending || 0).toLocaleString()}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">{(up.lifetime_earnings_sol || 0).toFixed(4)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(up)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUserPoints.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>SOL Amount</TableHead>
                    <TableHead>Tx Signature</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs">{tx.wallet_address.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tx.transaction_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {tx.points > 0 ? (
                            <ArrowUpRight className="w-3 h-3 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 text-red-500" />
                          )}
                          <span className={tx.points > 0 ? 'text-green-500' : 'text-red-500'}>
                            {tx.points > 0 ? '+' : ''}{tx.points}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{tx.sol_amount?.toFixed(4) || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.tx_signature ? (
                          <a 
                            href={`https://solscan.io/tx/${tx.tx_signature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline text-primary"
                          >
                            {tx.tx_signature.slice(0, 8)}...
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{new Date(tx.created_at || '').toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Points</DialogTitle>
            <DialogDescription>Wallet: {editingUser?.wallet_address.slice(0, 12)}...</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Total Points</Label>
              <Input
                type="number"
                value={formData.total_points}
                onChange={(e) => setFormData(prev => ({ ...prev, total_points: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Pending Points</Label>
              <Input
                type="number"
                value={formData.points_pending}
                onChange={(e) => setFormData(prev => ({ ...prev, points_pending: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason for Adjustment</Label>
              <Input
                placeholder="e.g., Manual correction, bonus points..."
                value={formData.adjustment_reason}
                onChange={(e) => setFormData(prev => ({ ...prev, adjustment_reason: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
