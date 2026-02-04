import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function downloadIkigaiCard(
  elementId: string,
  format: 'png' | 'pdf' = 'png',
  filename: string = 'ikigai-card'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return;
  }

  try {
    // Hide elements that shouldn't be in the export
    const formElement = element.querySelector('[data-export-hide="true"]');
    if (formElement) {
      (formElement as HTMLElement).style.display = 'none';
    }

    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
    });

    // Restore hidden elements
    if (formElement) {
      (formElement as HTMLElement).style.display = '';
    }

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else if (format === 'pdf') {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${filename}.pdf`);
    }
  } catch (error) {
    console.error('Error generating ikigai card:', error);
    throw error;
  }
}
