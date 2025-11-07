import { FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CVProfilesEmptyProps {
  onUploadClick: () => void;
}

export const CVProfilesEmpty = ({ onUploadClick }: CVProfilesEmptyProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur border-2 border-dashed">
      <CardContent className="pt-12 pb-12 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="p-6 rounded-full bg-primary/10">
            <FileCheck className="h-16 w-16 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">No CV Profiles Yet</h3>
            <p className="text-muted-foreground max-w-md">
              Upload your first CV to get AI-powered analysis and unlock Club membership benefits
            </p>
          </div>
          <Button 
            size="lg"
            onClick={onUploadClick}
            className="mt-4"
          >
            <FileCheck className="h-5 w-5 mr-2" />
            Upload Your First CV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
