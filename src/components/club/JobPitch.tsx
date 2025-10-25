import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, DollarSign, Clock, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobPitchProps {
  memberData: any;
}

const RATE_TYPES = ['HOURLY', 'PROJECT', 'FULL-TIME', 'PART-TIME'] as const;
const AVAILABILITY = ['IMMEDIATE', '2 WEEKS', '1 MONTH', 'FLEXIBLE'] as const;

export function JobPitch({ memberData }: JobPitchProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [pitch, setPitch] = useState('');
  const [rateType, setRateType] = useState<typeof RATE_TYPES[number]>('PROJECT');
  const [rate, setRate] = useState('');
  const [availability, setAvailability] = useState<typeof AVAILABILITY[number]>('IMMEDIATE');
  const [specialization, setSpecialization] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !pitch) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    
    toast({
      title: 'Pitch Submitted!',
      description: 'Your job pitch is now visible to verified companies',
    });

    // Reset form
    setTitle('');
    setPitch('');
    setRate('');
    setSpecialization('');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-transparent border border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-sm">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-mono text-foreground">JOB PITCH</CardTitle>
              <p className="text-sm text-muted-foreground font-mono">
                SHOWCASE WHAT YOU'RE LOOKING FOR
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Member Badge */}
          <div className="p-4 bg-background border border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-mono mb-1">PITCHING AS</p>
              <p className="text-sm font-mono text-foreground font-bold">
                {memberData?.display_name || memberData?.handle}
              </p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 border-primary/20 text-primary font-mono">
              VERIFIED MEMBER
            </Badge>
          </div>

          {/* Pitch Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="font-mono text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              PITCH HEADLINE *
            </Label>
            <Input
              id="title"
              placeholder="E.G. EXPERIENCED SOLIDITY DEV SEEKING DEFI PROJECT"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {/* Main Pitch */}
          <div className="space-y-2">
            <Label htmlFor="pitch" className="font-mono text-sm">YOUR PITCH *</Label>
            <Textarea
              id="pitch"
              placeholder="TELL COMPANIES WHAT YOU'RE LOOKING FOR, YOUR UNIQUE VALUE, AND WHY THEY SHOULD HIRE YOU..."
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              rows={8}
              className="font-mono text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground font-mono">
              {pitch.length} / 1000 CHARACTERS
            </p>
          </div>

          {/* Rate & Compensation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-mono text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                RATE TYPE
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {RATE_TYPES.map((type) => (
                  <Button
                    key={type}
                    onClick={() => setRateType(type)}
                    variant={rateType === type ? 'default' : 'outline'}
                    size="sm"
                    className="font-mono text-xs"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate" className="font-mono text-sm">EXPECTED RATE (USD)</Label>
              <Input
                id="rate"
                placeholder="E.G. 150 / HR OR 10000 / PROJECT"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <Label className="font-mono text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              AVAILABILITY
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABILITY.map((avail) => (
                <Button
                  key={avail}
                  onClick={() => setAvailability(avail)}
                  variant={availability === avail ? 'default' : 'outline'}
                  size="sm"
                  className="font-mono text-xs"
                >
                  {avail}
                </Button>
              ))}
            </div>
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <Label htmlFor="specialization" className="font-mono text-sm">
              KEY SPECIALIZATION
            </Label>
            <Input
              id="specialization"
              placeholder="E.G. SMART CONTRACT AUDITING, DEFI PROTOCOLS, NFT MARKETPLACES"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !title || !pitch}
              className="w-full font-mono"
              size="lg"
            >
              {isSubmitting ? (
                <>SUBMITTING...</>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  SUBMIT PITCH
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground font-mono mt-3 text-center">
              YOUR PITCH WILL BE VISIBLE TO VERIFIED WEB3 COMPANIES
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
