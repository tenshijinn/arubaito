import { FileCheck } from "lucide-react";
import { INK, CREAM, MUTED, BORDER, DISPLAY, MONO, SANS, cardStyle, labelStyle } from "@/lib/aesthetics";

interface CVProfilesEmptyProps { onUploadClick: () => void }

export const CVProfilesEmpty = ({ onUploadClick }: CVProfilesEmptyProps) => {
  return (
    <div style={{ ...cardStyle(), borderStyle: "dashed" }} className="p-12 text-center">
      <div className="flex items-center justify-between mb-6">
        <span style={labelStyle()}>{"Empty State"}</span>
        <span style={labelStyle()}>{"Get Started"}</span>
      </div>
      <div className="flex flex-col items-center gap-6">
        <div className="p-5 rounded-full" style={{ border: `1.5px solid ${BORDER}` }}>
          <FileCheck className="h-12 w-12" style={{ color: INK }} />
        </div>
        <div className="space-y-2">
          <h3 style={{ fontFamily: DISPLAY, fontSize: 24, color: INK }}>No CV Profiles Yet</h3>
          <p className="max-w-md mx-auto" style={{ fontFamily: MONO, fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
            Upload your first CV to get AI-powered analysis and unlock Club membership benefits
          </p>
        </div>
        <button
          onClick={onUploadClick}
          className="px-6 py-3 rounded-full text-sm inline-flex items-center gap-2 transition-opacity hover:opacity-80 mt-2"
          style={{ background: INK, color: CREAM, fontFamily: SANS }}
        >
          <FileCheck className="h-4 w-4" /> Upload Your First CV
        </button>
      </div>
    </div>
  );
};
