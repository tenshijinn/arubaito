import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  details?: string;
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    date: 'Q1 2025',
    title: 'PLATFORM LAUNCH',
    description: 'Official launch of the exclusive member portal with core features',
    status: 'completed',
    details: 'Successfully onboarded initial cohort of verified Web3 talent. Established verification protocols and NFT minting system.',
  },
  {
    id: '2',
    date: 'Q2 2025',
    title: 'CV BUILDER & JOB BOARD',
    description: 'Professional profile system and direct job matching',
    status: 'current',
    details: 'Members can now create comprehensive profiles and pitch directly to hiring companies. Enhanced matching algorithms connect talent with opportunities.',
  },
  {
    id: '3',
    date: 'Q3 2025',
    title: 'REPUTATION SYSTEM',
    description: 'On-chain reputation tracking and endorsements',
    status: 'upcoming',
    details: 'Introducing peer endorsements, project verification, and reputation scoring that travels with your wallet across the Web3 ecosystem.',
  },
  {
    id: '4',
    date: 'Q4 2025',
    title: 'DAO GOVERNANCE',
    description: 'Member voting rights and platform governance',
    status: 'upcoming',
    details: 'Token-gated governance enabling members to vote on platform features, verification criteria, and treasury allocation.',
  },
  {
    id: '5',
    date: 'Q1 2026',
    title: 'GLOBAL EXPANSION',
    description: 'Multi-chain support and international partnerships',
    status: 'upcoming',
    details: 'Expanding to Ethereum, Base, and Polygon networks. Partnering with major Web3 companies for exclusive hiring access.',
  },
];

export function ClubTimeline() {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const getStatusIcon = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case 'current':
        return <Clock className="h-5 w-5 text-primary animate-pulse" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">COMPLETED</Badge>;
      case 'current':
        return <Badge variant="secondary" className="bg-primary/20 text-primary border-primary animate-pulse">IN PROGRESS</Badge>;
      default:
        return <Badge variant="outline" className="border-muted-foreground/20">UPCOMING</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-transparent border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-mono text-foreground">MEMBERSHIP ROADMAP</CardTitle>
          <p className="text-sm text-muted-foreground font-mono">
            TRACK OUR JOURNEY AND UPCOMING MILESTONES
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timeline */}
          <div className="relative space-y-8 pl-8 border-l-2 border-border">
            {TIMELINE_EVENTS.map((event, index) => (
              <div key={event.id} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[33px] top-1">
                  {getStatusIcon(event.status)}
                </div>

                {/* Event card */}
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="w-full text-left group"
                >
                  <Card className="bg-transparent border border-border hover:border-primary/50 transition-all hover:shadow-[0_0_15px_rgba(237,86,90,0.1)]">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-mono">{event.date}</p>
                          <h3 className="text-base font-bold text-foreground font-mono group-hover:text-primary transition-colors">
                            {event.title}
                          </h3>
                        </div>
                        {getStatusBadge(event.status)}
                      </div>
                      <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                        {event.description}
                      </p>
                    </CardContent>
                  </Card>
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Event Details */}
      {selectedEvent && (
        <Card className="bg-transparent border border-primary/50 shadow-[0_0_20px_rgba(237,86,90,0.15)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">{selectedEvent.date}</p>
                <CardTitle className="text-xl font-mono text-foreground">
                  {selectedEvent.title}
                </CardTitle>
              </div>
              {getStatusBadge(selectedEvent.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              {selectedEvent.description}
            </p>
            {selectedEvent.details && (
              <div className="p-4 bg-background border border-border">
                <p className="text-xs text-foreground font-mono leading-relaxed">
                  {selectedEvent.details}
                </p>
              </div>
            )}
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-xs text-primary hover:text-primary/80 font-mono underline"
            >
              CLOSE DETAILS
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
