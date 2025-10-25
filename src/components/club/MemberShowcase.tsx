import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Lock } from 'lucide-react';

export function MemberShowcase() {
  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-sm">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-mono text-foreground">MEMBER SPOTLIGHT</CardTitle>
              <p className="text-sm text-muted-foreground font-mono">
                SHOWCASE YOUR WORK AND ACHIEVEMENTS
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Coming Soon */}
          <div className="py-16 text-center space-y-6">
            <div className="mx-auto h-20 w-20 rounded-sm bg-muted flex items-center justify-center">
              <Lock className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-mono text-foreground">COMING SOON</h3>
              <p className="text-sm text-muted-foreground font-mono max-w-md mx-auto leading-relaxed">
                THIS EXCLUSIVE SECTION WILL ALLOW MEMBERS TO SHOWCASE THEIR PROJECTS, ACHIEVEMENTS, AND CONTRIBUTIONS TO THE WEB3 ECOSYSTEM
              </p>
            </div>
            <div className="pt-4 space-y-3">
              <div className="p-4 bg-background border border-border max-w-md mx-auto">
                <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                  PLANNED FEATURES:
                </p>
                <ul className="text-xs font-mono text-foreground mt-2 space-y-1 text-left">
                  <li>• PROJECT PORTFOLIO GALLERIES</li>
                  <li>• ACHIEVEMENT BADGES & MILESTONES</li>
                  <li>• PEER ENDORSEMENTS & REVIEWS</li>
                  <li>• CASE STUDIES & SUCCESS STORIES</li>
                  <li>• MEMBER-GENERATED CONTENT</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                EXPECTED LAUNCH: Q3 2025
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
