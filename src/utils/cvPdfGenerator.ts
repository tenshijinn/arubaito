import jsPDF from "jspdf";

interface CVContent {
  personal_info?: {
    name: string | null;
    location: string | null;
    professional_title: string | null;
  };
  describe_yourself?: string;
  web3_communities?: string[];
  hard_skills?: string[];
  soft_skills?: string[];
  languages?: string[];
  education?: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  work_experience?: Array<{
    company: string;
    role: string;
    duration: string;
    highlights?: string[];
  }>;
  hobbies?: string[];
}

interface VerifiedProject {
  name: string;
  chain: string;
  interactions?: number | string;
}

interface CVPDFData {
  userName: string;
  profileImageUrl?: string | null;
  overallScore: number;
  cvContent?: CVContent | null;
  createdAt: string;
  twitterHandle?: string;
  verifiedProjects?: VerifiedProject[];
  detectedChains?: string[];
}

// Check if work experience matches verified on-chain activity
const isWorkExperienceVerified = (
  exp: { company: string; role: string; highlights?: string[] },
  verifiedProjects: VerifiedProject[],
  detectedChains: string[]
): { verified: boolean; chain?: string } => {
  const textToSearch = `${exp.company} ${exp.role} ${exp.highlights?.join(' ') || ''}`.toLowerCase();
  
  // Check against verified project names
  for (const project of verifiedProjects) {
    if (textToSearch.includes(project.name.toLowerCase())) {
      return { verified: true, chain: project.chain };
    }
  }
  
  // Check for chain names in work experience
  const chainKeywords = ['ethereum', 'solana', 'arbitrum', 'polygon', 'base', 'optimism', 'avalanche', 'fantom', 'bsc', 'binance'];
  for (const chain of chainKeywords) {
    if (textToSearch.includes(chain)) {
      // Check if user has activity on that chain
      const hasChainActivity = detectedChains.some(dc => dc.toLowerCase().includes(chain));
      if (hasChainActivity) {
        return { verified: true, chain };
      }
    }
  }
  
  // Check for common dApp/protocol mentions
  const dappKeywords = ['uniswap', 'aave', 'compound', 'opensea', 'blur', 'jupiter', 'raydium', 'marinade', 'lido', 'curve', 'sushiswap', 'pancakeswap', 'gmx', 'dydx'];
  for (const dapp of dappKeywords) {
    if (textToSearch.includes(dapp)) {
      for (const project of verifiedProjects) {
        if (project.name.toLowerCase().includes(dapp)) {
          return { verified: true, chain: project.chain };
        }
      }
    }
  }
  
  return { verified: false };
};

export const generateCVProfilePDF = async (data: CVPDFData): Promise<void> => {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Colors (converted from HSL to RGB approximations)
  const primaryColor: [number, number, number] = [237, 86, 90]; // #ed565a
  const textColor: [number, number, number] = [255, 255, 255];
  const mutedColor: [number, number, number] = [156, 163, 175];
  const bgColor: [number, number, number] = [24, 24, 24]; // #181818

  // Background
  pdf.setFillColor(...bgColor);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // Header Section
  pdf.setTextColor(...textColor);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.userName, margin, yPos + 8);
  yPos += 12;

  if (data.twitterHandle) {
    pdf.setFontSize(11);
    pdf.setTextColor(...mutedColor);
    pdf.setFont("helvetica", "normal");
    pdf.text(`@${data.twitterHandle}`, margin, yPos + 4);
    yPos += 8;
  }

  // Professional Title
  if (data.cvContent?.personal_info?.professional_title) {
    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.text(data.cvContent.personal_info.professional_title, margin, yPos + 6);
    yPos += 10;
  }

  // Location
  if (data.cvContent?.personal_info?.location) {
    pdf.setFontSize(10);
    pdf.setTextColor(...mutedColor);
    pdf.text(data.cvContent.personal_info.location, margin, yPos + 4);
    yPos += 8;
  }

  yPos += 6;

  // Score Box
  const scoreBoxWidth = 50;
  const scoreBoxHeight = 30;
  const scoreBoxX = pageWidth - margin - scoreBoxWidth;
  const scoreBoxY = margin;

  pdf.setFillColor(237, 86, 90, 0.2);
  pdf.setDrawColor(...primaryColor);
  pdf.roundedRect(scoreBoxX, scoreBoxY, scoreBoxWidth, scoreBoxHeight, 3, 3, "FD");

  pdf.setFontSize(20);
  pdf.setTextColor(...primaryColor);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.overallScore.toFixed(1), scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 14, { align: "center" });

  pdf.setFontSize(8);
  pdf.setTextColor(...mutedColor);
  pdf.text("CV SCORE", scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 22, { align: "center" });

  // Divider
  yPos += 4;
  pdf.setDrawColor(...mutedColor);
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Helper function to add section
  const addSection = (title: string, content: string | string[] | undefined, isList = false) => {
    if (!content || (Array.isArray(content) && content.length === 0)) return;

    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      pdf.setFillColor(...bgColor);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      yPos = margin;
    }

    pdf.setFontSize(11);
    pdf.setTextColor(...primaryColor);
    pdf.setFont("helvetica", "bold");
    pdf.text(title.toUpperCase(), margin, yPos);
    yPos += 6;

    pdf.setFontSize(10);
    pdf.setTextColor(...textColor);
    pdf.setFont("helvetica", "normal");

    if (isList && Array.isArray(content)) {
      const itemsPerLine = 3;
      for (let i = 0; i < content.length; i += itemsPerLine) {
        const lineItems = content.slice(i, i + itemsPerLine).join("  •  ");
        const lines = pdf.splitTextToSize(lineItems, pageWidth - 2 * margin);
        pdf.text(lines, margin, yPos);
        yPos += lines.length * 5;
      }
    } else if (typeof content === "string") {
      const lines = pdf.splitTextToSize(content, pageWidth - 2 * margin);
      pdf.text(lines, margin, yPos);
      yPos += lines.length * 5;
    }

    yPos += 6;
  };

  // About Me
  addSection("About Me", data.cvContent?.describe_yourself);

  // Skills
  const allSkills = [...(data.cvContent?.hard_skills || []), ...(data.cvContent?.soft_skills || [])];
  addSection("Skills", allSkills, true);

  // Web3 Communities
  addSection("Web3 Communities", data.cvContent?.web3_communities, true);

  // Work Experience
  if (data.cvContent?.work_experience && data.cvContent.work_experience.length > 0) {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      pdf.setFillColor(...bgColor);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      yPos = margin;
    }

    pdf.setFontSize(11);
    pdf.setTextColor(...primaryColor);
    pdf.setFont("helvetica", "bold");
    pdf.text("WORK EXPERIENCE", margin, yPos);
    yPos += 8;

    const verifiedProjects = data.verifiedProjects || [];
    const detectedChains = data.detectedChains || [];

    for (const exp of data.cvContent.work_experience) {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        pdf.setFillColor(...bgColor);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");
        yPos = margin;
      }

      pdf.setFontSize(10);
      pdf.setTextColor(...textColor);
      pdf.setFont("helvetica", "bold");
      
      const roleText = `${exp.role} at ${exp.company}`;
      pdf.text(roleText, margin, yPos);

      pdf.setTextColor(...mutedColor);
      pdf.setFont("helvetica", "normal");
      pdf.text(exp.duration, pageWidth - margin, yPos, { align: "right" });
      yPos += 5;

      // Check if this work experience is verified on-chain
      const verification = isWorkExperienceVerified(exp, verifiedProjects, detectedChains);
      if (verification.verified) {
        const verifiedColor: [number, number, number] = [34, 197, 94]; // Green #22c55e
        pdf.setTextColor(...verifiedColor);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.text("✓ Verified On-Chain", margin, yPos);
        yPos += 4;
      }

      if (exp.highlights && exp.highlights.length > 0) {
        pdf.setFontSize(10);
        pdf.setTextColor(...textColor);
        pdf.setFont("helvetica", "normal");
        for (const highlight of exp.highlights.slice(0, 2)) {
          const lines = pdf.splitTextToSize(`• ${highlight}`, pageWidth - 2 * margin - 5);
          pdf.text(lines, margin + 3, yPos);
          yPos += lines.length * 4;
        }
      }
      yPos += 4;
    }
    yPos += 4;
  }

  // Education
  if (data.cvContent?.education && data.cvContent.education.length > 0) {
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      pdf.setFillColor(...bgColor);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      yPos = margin;
    }

    pdf.setFontSize(11);
    pdf.setTextColor(...primaryColor);
    pdf.setFont("helvetica", "bold");
    pdf.text("EDUCATION", margin, yPos);
    yPos += 8;

    for (const edu of data.cvContent.education) {
      pdf.setFontSize(10);
      pdf.setTextColor(...textColor);
      pdf.setFont("helvetica", "bold");
      pdf.text(edu.degree, margin, yPos);
      yPos += 5;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...mutedColor);
      pdf.text(`${edu.institution} • ${edu.year}`, margin, yPos);
      yPos += 7;
    }
    yPos += 4;
  }

  // Languages
  addSection("Languages", data.cvContent?.languages, true);

  // Footer
  const footerY = pageHeight - 15;

  pdf.setDrawColor(...mutedColor);
  pdf.setLineWidth(0.3);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  pdf.setFontSize(9);
  pdf.setTextColor(...primaryColor);
  pdf.setFont("helvetica", "bold");
  pdf.text("ARUBAITO", margin, footerY);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...mutedColor);
  pdf.text("Cross-Verified On-Chain with Arubaito App", margin + 25, footerY);

  const verificationDate = new Date(data.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  pdf.text(verificationDate, pageWidth - margin, footerY, { align: "right" });

  // Download
  const fileName = `${data.userName.replace(/\s+/g, "_")}_CV_Profile.pdf`;
  pdf.save(fileName);
};
