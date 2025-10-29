import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card } from "./ui/card";
import { toast } from "./ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

const ROLE_TAGS = [
  "Developer", "Designer", "Marketing", "Writer", "Community Manager",
  "Sales", "Product Manager", "Data Analyst", "DevOps", "Other"
];

interface CommunitySubmissionFormProps {
  walletAddress: string;
  xUserId?: string;
  onSuccess?: () => void;
}

export const CommunitySubmissionForm = ({ walletAddress, xUserId, onSuccess }: CommunitySubmissionFormProps) => {
  const [submissionType, setSubmissionType] = useState<'job' | 'task'>('job');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [compensation, setCompensation] = useState('');
  const [roleTags, setRoleTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState<any>(null);

  const handleCheckDuplicate = async () => {
    if (!link || !title) {
      toast({
        title: "Missing information",
        description: "Please enter both title and link first",
        variant: "destructive",
      });
      return;
    }

    setCheckingDuplicate(true);
    setDuplicateCheck(null);

    try {
      const { data, error } = await supabase.functions.invoke('check-duplicate-opportunity', {
        body: { title, link, type: submissionType }
      });

      if (error) throw error;

      setDuplicateCheck(data);

      if (data.isDuplicate) {
        toast({
          title: "Duplicate found",
          description: data.reason,
          variant: "destructive",
        });
      } else {
        toast({
          title: "No duplicates",
          description: "This opportunity appears to be unique!",
        });
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
      toast({
        title: "Error",
        description: "Failed to check for duplicates",
        variant: "destructive",
      });
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-community-opportunity', {
        body: {
          submission_type: submissionType,
          submitter_wallet: walletAddress,
          submitter_x_user_id: xUserId,
          title,
          description,
          link,
          compensation,
          role_tags: roleTags,
        }
      });

      if (error) throw error;

      if (data.isDuplicate) {
        toast({
          title: "Duplicate submission",
          description: data.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: data.message,
        });

        // Reset form
        setTitle('');
        setDescription('');
        setLink('');
        setCompensation('');
        setRoleTags([]);
        setDuplicateCheck(null);

        onSuccess?.();
      }
    } catch (error) {
      console.error('Error submitting:', error);
      toast({
        title: "Error",
        description: "Failed to submit opportunity",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pointsToEarn = submissionType === 'job' ? 100 : 50;

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Type</Label>
          <Select value={submissionType} onValueChange={(value: 'job' | 'task') => setSubmissionType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="job">Job (100 points)</SelectItem>
              <SelectItem value="task">Task (50 points)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            required
          />
        </div>

        <div>
          <Label htmlFor="link">Link *</Label>
          <div className="flex gap-2">
            <Input
              id="link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com/opportunity"
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckDuplicate}
              disabled={checkingDuplicate || !link || !title}
            >
              {checkingDuplicate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
            </Button>
          </div>
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ExternalLink className="h-3 w-3" />
              Preview link
            </a>
          )}
        </div>

        {duplicateCheck && (
          <Alert variant={duplicateCheck.isDuplicate ? "destructive" : "default"}>
            {duplicateCheck.isDuplicate ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertDescription>
              {duplicateCheck.reason}
              {duplicateCheck.matchedTitle && ` - "${duplicateCheck.matchedTitle}"`}
            </AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the opportunity..."
            rows={4}
            required
          />
        </div>

        <div>
          <Label htmlFor="compensation">Compensation</Label>
          <Input
            id="compensation"
            value={compensation}
            onChange={(e) => setCompensation(e.target.value)}
            placeholder="e.g., $50k-$70k, 0.5 SOL, Negotiable"
          />
        </div>

        <div>
          <Label>Role Tags</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {ROLE_TAGS.map(tag => (
              <Button
                key={tag}
                type="button"
                variant={roleTags.includes(tag) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRoleTags(prev =>
                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                  );
                }}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Earn {pointsToEarn} points</strong> when your submission is approved!
            Points can be converted to SOL from Rei's Treasury.
          </AlertDescription>
        </Alert>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || (duplicateCheck?.isDuplicate)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            `Submit ${submissionType}`
          )}
        </Button>
      </form>
    </Card>
  );
};