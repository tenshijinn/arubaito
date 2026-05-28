import { useState } from "react";
import { FileCheck, Award, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { INK, CREAM, ACCENT, MUTED, BORDER, DISPLAY, MONO, cardStyle, labelStyle } from "@/lib/aesthetics";

interface CVProfileCardProps {
  id: string;
  fileName: string;
  overallScore: number;
  createdAt: string;
  bluechipVerified?: boolean;
  onClick: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const CVProfileCard = ({ id, fileName, overallScore, createdAt, bluechipVerified = false, onClick, onDelete }: CVProfileCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Work";
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      setIsDeleting(true);
      await onDelete(id);
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={() => onClick(id)}
      style={cardStyle()}
      className="p-5 cursor-pointer transition-all hover:opacity-90 group relative"
    >
      <div className="flex items-center justify-between mb-4">
        <span style={labelStyle()}>{"CV Profile"}</span>
        <span style={labelStyle()}>
          {new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-full shrink-0" style={{ border: `1.5px solid ${BORDER}` }}>
              <FileCheck className="h-4 w-4" style={{ color: INK }} />
            </div>
            <h3 className="truncate" style={{ fontFamily: DISPLAY, fontSize: 16, color: INK }}>{fileName}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {bluechipVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: INK, color: CREAM, fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em" }}>
                <Award className="h-3 w-3" />OG
              </span>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="h-7 w-7 inline-flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ border: `1px solid ${BORDER}`, color: ACCENT }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete CV Profile</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{fileName}"? This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} style={{ background: ACCENT, color: CREAM }}>
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div>
            <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>Overall Score</p>
            <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 2 }}>{getScoreLabel(overallScore)}</p>
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 36, color: INK, lineHeight: 1 }}>{overallScore}</div>
        </div>
      </div>
    </div>
  );
};
