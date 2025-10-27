import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Member {
  wallet_address: string;
  handle: string;
  display_name: string;
  profile_image_url: string;
  role_tags: string[];
  verified: boolean;
  profile_score?: number;
  created_at: string;
}

export function MemberShowcase() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleTag, setSelectedRoleTag] = useState<string | null>(null);
  const [allRoleTags, setAllRoleTags] = useState<string[]>([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, selectedRoleTag, members]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("rei_registry")
        .select("wallet_address, handle, display_name, profile_image_url, role_tags, verified, profile_score, created_at")
        .eq("verified", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMembers(data || []);
      
      // Extract unique role tags
      const tags = new Set<string>();
      data?.forEach(member => {
        member.role_tags?.forEach((tag: string) => tags.add(tag));
      });
      setAllRoleTags(Array.from(tags).sort());

    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        title: "Error",
        description: "Failed to load member directory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...members];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member => 
        member.display_name?.toLowerCase().includes(query) ||
        member.handle?.toLowerCase().includes(query)
      );
    }

    // Apply role tag filter
    if (selectedRoleTag) {
      filtered = filtered.filter(member => 
        member.role_tags?.includes(selectedRoleTag)
      );
    }

    setFilteredMembers(filtered);
  };

  const handleViewProfile = (handle: string) => {
    navigate(`/club/profile/${handle}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-transparent border border-border">
          <CardHeader>
            <CardTitle className="text-xl font-mono">MEMBER DIRECTORY</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-transparent border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-mono text-foreground">MEMBER DIRECTORY</CardTitle>
          <p className="text-sm text-muted-foreground font-mono">
            DISCOVER VERIFIED WEB3 TALENT
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="SEARCH BY NAME OR HANDLE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 font-mono"
              />
            </div>

            {/* Role Tag Filters */}
            {allRoleTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedRoleTag === null ? "default" : "outline"}
                  className="cursor-pointer font-mono"
                  onClick={() => setSelectedRoleTag(null)}
                >
                  ALL
                </Badge>
                {allRoleTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedRoleTag === tag ? "default" : "outline"}
                    className="cursor-pointer font-mono"
                    onClick={() => setSelectedRoleTag(selectedRoleTag === tag ? null : tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Members Grid */}
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-mono">
                {searchQuery || selectedRoleTag 
                  ? "NO MEMBERS FOUND MATCHING YOUR FILTERS" 
                  : "NO VERIFIED MEMBERS YET"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <Card key={member.wallet_address} className="bg-transparent border border-border hover:border-primary transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={member.profile_image_url} alt={member.display_name} />
                        <AvatarFallback className="text-2xl font-mono">
                          {member.display_name?.[0] || member.handle?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="w-full">
                        <h3 className="font-mono font-semibold text-lg truncate">
                          {member.display_name || member.handle}
                        </h3>
                        <p className="text-sm text-muted-foreground font-mono truncate">
                          @{member.handle}
                        </p>
                      </div>

                      {member.role_tags && member.role_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {member.role_tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs font-mono">
                              {tag}
                            </Badge>
                          ))}
                          {member.role_tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs font-mono">
                              +{member.role_tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {member.profile_score && (
                        <div className="text-sm font-mono text-muted-foreground">
                          SCORE: <span className="text-primary font-semibold">{member.profile_score}</span>
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full font-mono"
                        onClick={() => handleViewProfile(member.handle)}
                      >
                        VIEW PROFILE
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}