// src/utils/pdf.js
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * element: DOM element to render
 * filename: for download suggestion (not used in storage)
 * options: { scale }
 */
export async function generatePdfBlobFromElement(element, options = {}) {
  const scale = options.scale || 2;
  // Use html2canvas to capture element
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    scrollY: -window.scrollY,
    windowWidth: document.documentElement.offsetWidth,
  });
  const imgData = canvas.toDataURL("image/png");
  // A4 size in jsPDF (portrait)
  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  // calculate width/height to maintain aspect ratio
  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pageWidth - 40; // margins
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
  let cursorY = 20;
  pdf.addImage(imgData, "PNG", 20, cursorY, imgWidth, imgHeight);
  const pdfBlob = pdf.output("blob");
  return pdfBlob;
}
