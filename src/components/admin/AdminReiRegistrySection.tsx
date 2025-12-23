import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, ExternalLink, Edit2, Check, Users, CheckCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ReiProfile {
  id: string;
  handle: string | null;
  display_name: string | null;
  wallet_address: string;
  profile_score: number | null;
  verified: boolean | null;
  role_tags: string[] | null;
  created_at: string;
  x_user_id: string | null;
  profile_image_url: string | null;
  bio: string | null;
  nft_minted: boolean | null;
}

interface AdminReiRegistrySectionProps {
  adminHandle: string;
}

export function AdminReiRegistrySection({ adminHandle }: AdminReiRegistrySectionProps) {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ReiProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProfile, setEditingProfile] = useState<ReiProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    verified: false,
    profile_score: 0,
    role_tags: [] as string[],
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('rei_registry')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch REI profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (profile: ReiProfile) => {
    setEditingProfile(profile);
    setFormData({
      verified: profile.verified || false,
      profile_score: profile.profile_score || 0,
      role_tags: profile.role_tags || [],
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingProfile) return;
    
    setIsSaving(true);
    try {
      const previousValue = { 
        verified: editingProfile.verified, 
        profile_score: editingProfile.profile_score,
        role_tags: editingProfile.role_tags 
      };
      
      const { error } = await supabase
        .from('rei_registry')
        .update({
          verified: formData.verified,
          profile_score: formData.profile_score,
          role_tags: formData.role_tags as ("dev" | "product" | "research" | "community" | "design" | "ops")[],
        })
        .eq('id', editingProfile.id);

      if (error) throw error;

      await logAdminAction('UPDATE', 'rei_registry', editingProfile.id, previousValue, formData);

      toast({
        title: "Saved",
        description: "Profile updated successfully",
      });
      setIsDialogOpen(false);
      setEditingProfile(null);
      await fetchProfiles();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVerified = async (profileId: string, currentVerified: boolean) => {
    try {
      const { error } = await supabase
        .from('rei_registry')
        .update({ verified: !currentVerified })
        .eq('id', profileId);

      if (error) throw error;

      await logAdminAction('UPDATE', 'rei_registry', profileId, { verified: currentVerified }, { verified: !currentVerified });

      toast({
        title: "Updated",
        description: `Profile ${!currentVerified ? 'verified' : 'unverified'}`,
      });
      await fetchProfiles();
    } catch (error: any) {
      console.error('Error toggling verified:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
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

  const filteredProfiles = profiles.filter(profile =>
    profile.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.wallet_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ROLE_OPTIONS = ['dev', 'product', 'research', 'community', 'design', 'ops'];

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
          <Users className="w-6 h-6" />
          REI Registry ({profiles.length})
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
                <TableHead>Profile</TableHead>
                <TableHead>Handle</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {profile.profile_image_url ? (
                        <img src={profile.profile_image_url} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted" />
                      )}
                      <span className="font-medium">{profile.display_name || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {profile.handle ? (
                      <a 
                        href={`https://x.com/${profile.handle}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        @{profile.handle}
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{profile.profile_score?.toFixed(1) || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVerified(profile.id, profile.verified || false)}
                    >
                      {profile.verified ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {profile.role_tags?.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(profile)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProfiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No profiles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile: {editingProfile?.display_name || editingProfile?.handle}</DialogTitle>
            <DialogDescription>Update profile details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Verified</Label>
              <Switch
                checked={formData.verified}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, verified: checked }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Profile Score</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.profile_score}
                onChange={(e) => setFormData(prev => ({ ...prev, profile_score: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role Tags</Label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <Badge
                    key={role}
                    variant={formData.role_tags.includes(role) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        role_tags: prev.role_tags.includes(role)
                          ? prev.role_tags.filter(r => r !== role)
                          : [...prev.role_tags, role]
                      }));
                    }}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
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
