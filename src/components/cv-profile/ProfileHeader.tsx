import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Wallet, FileText, User } from "lucide-react";
import { format } from "date-fns";

interface ProfileHeaderProps {
  fileName: string;
  createdAt: string;
  walletAddress: string | null;
  profileImageUrl: string | null;
  userName?: string;
  twitterHandle?: string;
}

export const ProfileHeader = ({
  fileName,
  createdAt,
  walletAddress,
  profileImageUrl,
  userName,
  twitterHandle,
}: ProfileHeaderProps) => {
  const displayName = userName || fileName.replace(/\.[^/.]+$/, "");
  const truncatedWallet = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <Avatar className="h-20 w-20 border-2 border-primary/30">
          <AvatarImage src={profileImageUrl || undefined} alt={displayName} />
          <AvatarFallback className="bg-secondary text-primary text-xl font-bold">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {displayName}
            </h2>
            {twitterHandle && (
              <p className="text-muted-foreground text-sm">
                @{twitterHandle}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{fileName}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Analyzed {format(new Date(createdAt), 'MMM d, yyyy')}</span>
            </div>

            {truncatedWallet && (
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <Badge variant="outline" className="font-mono text-xs">
                  {truncatedWallet}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
