import React, { useState, useRef, useEffect } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from "docx";
import Icon from "./Icon"; 
 
const BASE_URL = import.meta.env.VITE_BASE_URL;
 
// --- Helper: Convert Image URL to Base64 (with optional circular cropping) ---
const getBase64ImageFromURL = (url, circular = false) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url.startsWith("http") ? url : `${BASE_URL}${url}`;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (circular) {
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
      }

      // Center crop
      ctx.drawImage(
          img,
          (img.width - size) / 2,
          (img.height - size) / 2,
          size,
          size,
          0,
          0,
          size,
          size
      );

      try {
        // Use PNG to preserve transparency for circular clipping
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      } catch (e) {
        console.warn("CORS blocked image export:", url);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
};

// --- Helper: Render Initials as Circle ---
const renderInitials = (doc, x, y, size, text) => {
    // Fill circle
    doc.setFillColor(30, 41, 59); // NEXUS Slate
    doc.circle(x + size/2, y + size/2, size/2, 'F');
    
    // Draw Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(size * 0.35); // Smaller letters
    doc.setFont("helvetica", "bold");
    const textWidth = doc.getTextWidth(text);
    doc.text(text, x + (size/2) - (textWidth/2), y + (size/2) + (size * 0.12));
};

// --- Helper: Flatten nested objects ---
const flattenObject = (obj, parentKey = "", result = {}) => {
  if (obj === null || typeof obj !== "object") return result;
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const newKey = parentKey ? `${parentKey}_${key}` : key;
    const value = obj[key];
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (typeof v === "object" && v !== null) {
          flattenObject(v, `${newKey}_${i}`, result);
        } else {
          result[`${newKey}_${i}`] = v;
        }
      });
    } else if (typeof value === "object" && value !== null) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }
  return result;
};

// --- Helper: Format Row & Filter out Image URLs ---
const formatRow = (flatRow, bodyStructure, keys, includeImages = false) => {
  const imageKeywords = ["pic", "photo", "image", "avatar", "icon", "picture", "thumbnail"];
  const row = [];
  bodyStructure?.forEach((count, index) => {
    const keySet = keys[index];
    
    // For PDF, we might want to capture the image separately
    let imageData = null;

    const filteredKeys = keySet?.filter((k) => {
      const keyName = k.toLowerCase();
      const value = String(flatRow[k] || "").toLowerCase();
      const isImageKey = imageKeywords?.some(keyword => keyName?.includes(keyword));
      const isImageValue = /\.(jpg|jpeg|png|webp|gif|svg)$/.test(value) || value.includes("/media/");
      
      if (includeImages && (isImageKey || isImageValue) && !imageData) {
          imageData = flatRow[k];
      }

      return !isImageKey && !isImageValue; 
    });
    
    const textValues = filteredKeys?.map((k) => flatRow[k] ?? "").join("\n");
    
    if (includeImages) {
        row.push({ text: textValues, image: imageData });
    } else {
        row.push(textValues);
    }
  });
  return row;
};

export default function ExportTable({
  data = [],
  title = [],
  bodyStructure = [],
  keys = [],
  fileName = "Report",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Process Data for Numbering ---
  const numberedTitles = ["#", ...title];
  const flattenedData = data.map((d) => flattenObject(d));
  const formattedDataWithNumbers = flattenedData?.map((row, index) => {
    const formatted = formatRow(row, bodyStructure, keys);
    return [(index + 1).toString(), ...formatted];
  });

  // --- PDF Export ---
  const exportPDF = async () => {
    setIsOpen(false);
    
    // 1. Layout Constants (Narrower margins to fill the page)
    const doc = new jsPDF("p", "pt", "a4");
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 2. Branded Header
    try {
        const logoUrl = window.location.origin + "/logo.png"; 
        const logoBase64 = await getBase64ImageFromURL(logoUrl);
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', margin, 20, 40, 40);
        }
    } catch (e) {
        console.warn("Logo load failed", e);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("NEXUS SOLUTIONS", margin + 50, 40);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Tech & Talent Specialized HR System", margin + 50, 52);
    
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Report: ${fileName}`, margin, 75);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 87);
    doc.text(`Contact: info@nexussolutions.com`, margin, 99);
    doc.text(`Web: www.nexussolutions.com`, margin, 111);

    // 3. Prepare Data (Fetch circular images & initials)
    const processedBody = await Promise.all(
      data.map(async (d, rowIndex) => {
          const flatRow = flattenObject(d);
          const formatted = formatRow(flatRow, bodyStructure, keys, true);
          
          const rowWithVisuals = await Promise.all(
              formatted.map(async (cell, colIndex) => {
                  // Only provide visuals for the first data column (User column)
                  if (colIndex === 0 && cell && typeof cell === 'object' && cell.image !== undefined) {
                      let base64 = null;
                      if (cell.image) {
                        base64 = await getBase64ImageFromURL(cell.image, true);
                      }
                      
                      // Calculate initials from the first non-empty line of text
                      const firstLine = cell.text?.trim().split('\n')[0] || "";
                      const initials = firstLine
                          ? firstLine.split(' ').filter(p => p).map(n => n[0]).join('').toUpperCase().substring(0, 2)
                          : "?";

                      return { text: cell.text, image: base64, initials: initials };
                  }
                  // Return only text for all other columns
                  return typeof cell === 'object' ? cell.text : cell;
              })
          );
          
          return [(rowIndex + 1).toString(), ...rowWithVisuals];
      })
    );

    // 4. Render Table
    autoTable(doc, {
      head: [numberedTitles],
      body: processedBody.map(row => row.map(cell => typeof cell === 'object' ? cell.text : cell)),
      startY: 125,
      theme: 'grid',
      margin: { top: 125, left: margin, right: margin, bottom: 40 },
      styles: { 
        fontSize: title.length > 10 ? 7 : 8, 
        cellPadding: 5, 
        valign: 'middle',
        font: "helvetica"
      },
      headStyles: { 
        fillColor: [30, 41, 59], 
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center', fontStyle: 'bold' } 
      },
      
      didDrawCell: function (data) {
        // column index 1 corresponds to the first data column (User column)
        if (data.section === 'body' && data.column.index === 1) {
            const rowIndex = data.row.index;
            const cellData = (processedBody && processedBody[rowIndex]) ? processedBody[rowIndex][1] : null;

            if (cellData && typeof cellData === 'object' && (cellData.image || cellData.initials)) {
                const imgSize = 18; 
                const xPos = data.cell.x + 4;
                const yPos = data.cell.y + (data.cell.height / 2) - (imgSize / 2);
                
                if (cellData.image) {
                    try {
                        // Image is already circular PNG from getBase64ImageFromURL
                        doc.addImage(cellData.image, 'PNG', xPos, yPos, imgSize, imgSize);
                    } catch (e) {
                        console.warn("Failed to add image, falling back to initials", e);
                        renderInitials(doc, xPos, yPos, imgSize, cellData.initials);
                    }
                } else if (cellData.initials) {
                    renderInitials(doc, xPos, yPos, imgSize, cellData.initials);
                }
            }
        }
      },
      
      willDrawCell: function(data) {
          // column index 1 corresponds to the first data column (User column)
          if (data.section === 'body' && data.column.index === 1) {
              const rowIndex = data.row.index;
              const cellData = (processedBody && processedBody[rowIndex]) ? processedBody[rowIndex][1] : null;
              
              if (cellData && typeof cellData === 'object' && (cellData.image || cellData.initials)) {
                  // Add padding so text doesn't overlap the image/initials
                  data.cell.styles.cellPadding = { top: 5, bottom: 5, left: 26, right: 5 };
              }
          }
      },
      
      didDrawPage: (data) => {
        const str = 'Page ' + doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(str, data.settings.margin.left, pageHeight - 20);
      }
    });

    doc.save(`${fileName}.pdf`);
  };

  // --- Excel Export ---
  const exportExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([numberedTitles, ...formattedDataWithNumbers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    setIsOpen(false);
  };

  // --- Word Export ---
  const exportDOCX = async () => {
    const tableRows = [
      new TableRow({
        children: numberedTitles.map((t, i) => new TableCell({
          width: { size: i === 0 ? 5 : 95 / title.length, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ text: t, bold: true })],
        })),
      }),
      ...formattedDataWithNumbers.map(row => new TableRow({
        children: row.map(cell => new TableCell({
          children: [new Paragraph({ text: String(cell) })],
        })),
      })),
    ];

    const doc = new Document({
      sections: [{ children: [new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } })] }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 transition-all">
        <Icon name="Download" className="w-5 h-5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-xl ring-1 ring-opacity-5 ring-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in duration-100">
          <div className="p-1">
            <button onClick={exportPDF} className="flex w-full cursor-pointer items-center px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:shadow hover:bg-slate-100 dark:hover:bg-slate-700 gap-3 border-b border-gray-50 dark:border-slate-700">
              <span className="text-red-500"><Icon name="File" className="w-4 h-4" /></span>
              <div className="text-left">
                <p className="font-semibold">PDF Document</p>
                <p className="text-xs text-gray-400">Fixed layout for reference</p>
              </div>
            </button>
            <button onClick={exportExcel} className="flex w-full cursor-pointer items-center px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:shadow hover:bg-slate-100 dark:hover:bg-slate-700 gap-3 border-b border-gray-50 dark:border-slate-700">
              <span className="text-green-500"><Icon name="File" className="w-4 h-4" /></span>
              <div className="text-left">
                <p className="font-semibold">Excel Spreadsheet</p>
                <p className="text-xs text-gray-400">Best for calculations</p>
              </div>
            </button>
            <button onClick={exportDOCX} className="flex w-full cursor-pointer items-center px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:shadow hover:bg-slate-100 dark:hover:bg-slate-700 gap-3 border-b border-gray-50 dark:border-slate-700">
              <span className="text-blue-500"><Icon name="File" className="w-4 h-4" /></span>
              <div className="text-left">
                <p className="font-semibold">Word Document</p>
                <p className="text-xs text-gray-400">Best for documentation</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}






















































// // ExportTable.jsx
// import React, { useState, useRef, useEffect } from "react";
// import { saveAs } from "file-saver";
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from "docx";
// import Icon from "./Icon"; 

// // --- Helper: Flatten nested objects (e.g., { user: { name: "John" } } → { "user_name": "John" }) ---
// const flattenObject = (obj, parentKey = "", result = {}) => {
//   if (obj === null || typeof obj !== "object") return result;
//   for (const key in obj) {
//     if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
//     const newKey = parentKey ? `${parentKey}_${key}` : key;
//     const value = obj[key];
//     if (Array.isArray(value)) {
//       value.forEach((v, i) => {
//         if (typeof v === "object" && v !== null) {
//           flattenObject(v, `${newKey}_${i}`, result);
//         } else {
//           result[`${newKey}_${i}`] = v;
//         }
//       });
//     } else if (typeof value === "object" && value !== null) {
//       flattenObject(value, newKey, result);
//     } else {
//       result[newKey] = value;
//     }
//   }
//   return result;
// };

// // --- Helper: Format Row & Filter out Image URLs/Keywords ---
// const formatRow = (flatRow, bodyStructure, keys) => {
//   // Keywords that usually indicate an image field
//   const imageKeywords = ["pic", "photo", "image", "avatar", "icon", "picture", "thumbnail"];

//   const row = [];
//   bodyStructure.forEach((count, index) => {
//     const keySet = keys[index];

//     // Keep only keys that are NOT related to images and don't contain image file extensions
//     const filteredKeys = keySet.filter((k) => {
//       const keyName = k.toLowerCase();
//       const value = String(flatRow[k] || "").toLowerCase();

//       const isImageKey = imageKeywords.some(keyword => keyName.includes(keyword));
//       const isImageValue = /\.(jpg|jpeg|png|webp|gif|svg)$/.test(value);

//       return !isImageKey && !isImageValue; 
//     });

//     const values = filteredKeys.map((k) => flatRow[k] ?? "").join("\n");
//     row.push(values);
//   });
//   return row;
// };

// export default function ExportTable({
//   data = [],
//   title = [],
//   bodyStructure = [],
//   keys = [],
//   bg=" bg-slate-800 text-white px-4 py-2 rounded-md  shadow-sm focus:outline-none dark:bg-slate-700 dark:hover:bg-slate-600 hover:bg-slate-700",
//   fileName = "Report",
// }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   // Close dropdown if clicked outside
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Pre-process the data for all export methods
//   const flattenedData = data.map((d) => flattenObject(d));
//   const formattedData = flattenedData.map((row) => formatRow(row, bodyStructure, keys));

//   // --- Professional PDF Export ---
//   const exportPDF = () => {
//     const doc = new jsPDF("p", "pt", "a4");
    
//     // Add Header
//     doc.setFontSize(18);
//     doc.setTextColor(40, 40, 40);
//     doc.text(fileName, 40, 40);
    
//     doc.setFontSize(10);
//     doc.setTextColor(100, 100, 100);
//     doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 55);

//     autoTable(doc, {
//       head: [title],
//       body: formattedData,
//       startY: 75,
//       theme: 'grid',
//       styles: {
//         fontSize: 9,
//         cellPadding: 8,
//         valign: 'middle',
//         font: "helvetica",
//         lineWidth: 0.5,
//         lineColor: [200, 200, 200]
//       },
//       headStyles: {
//         fillColor: [30, 41, 59], // Dark Slate
//         textColor: [255, 255, 255],
//         fontStyle: 'bold',
//       },
//       alternateRowStyles: {
//         fillColor: [248, 250, 252],
//       },
//       margin: { top: 60, left: 40, right: 40, bottom: 40 },
//       didDrawPage: (data) => {
//         const str = 'Page ' + doc.internal.getNumberOfPages();
//         doc.setFontSize(8);
//         doc.text(str, data.settings.margin.left, doc.internal.pageSize.getHeight() - 20);
//       }
//     });

//     doc.save(`${fileName}.pdf`);
//     setIsOpen(false);
//   };

//   // --- Excel Export ---
//   const exportExcel = () => {
//     const ws = XLSX.utils.aoa_to_sheet([title, ...formattedData]);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Data_Export");
//     XLSX.writeFile(wb, `${fileName}.xlsx`);
//     setIsOpen(false);
//   };

//   // --- Word Export ---
//   const exportDOCX = async () => {
//     const tableRows = [
//       new TableRow({
//         children: title.map(t => new TableCell({
//           width: { size: 100 / title.length, type: WidthType.PERCENTAGE },
//           children: [new Paragraph({ text: t, bold: true })],
//         })),
//       }),
//       ...formattedData.map(row => new TableRow({
//         children: row.map(cell => new TableCell({
//           children: [new Paragraph({ text: String(cell) })],
//         })),
//       })),
//     ];

//     const doc = new Document({
//       sections: [{ children: [new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } })] }],
//     });

//     const blob = await Packer.toBlob(doc);
//     saveAs(blob, `${fileName}.docx`);
//     setIsOpen(false);
//   };

//   return (
//     <div className="relative inline-block text-left" ref={dropdownRef}>
//       {/* Professional Toggle Button */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="flex items-center gap-2 cursor-pointer transition-all"
//       >
//         <Icon name="Download" className="w-5 dark:hover:text-slate-100 text-slate-700 hover:text-slate-900 dark:text-slate-300 h-5" />
//       </button>

//       {/* Dropdown Menu */}
//       {isOpen && (
//         <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-xl ring-1 ring-opacity-5 ring-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in duration-100">
//           <div className="py-1">
//             <button onClick={exportPDF} className="flex w-full items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3 border-b border-gray-50 dark:border-slate-700">
//               <span className="text-red-500"><Icon name="File" className="w-4 h-4" /></span>
//               <div className="text-left">
//                 <p className="font-semibold">PDF Document</p>
//                 <p className="text-xs text-gray-400">Best for printing & sharing</p>
//               </div>
//             </button>
//             <button onClick={exportExcel} className="flex w-full items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3 border-b border-gray-50 dark:border-slate-700">
//               <span className="text-green-500"><Icon name="File" className="w-4 h-4" /></span>
//               <div className="text-left">
//                 <p className="font-semibold">Excel Spreadsheet</p>
//                 <p className="text-xs text-gray-400">Best for data analysis</p>
//               </div>
//             </button>
//             <button onClick={exportDOCX} className="flex w-full items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3">
//               <span className="text-blue-500"><Icon name="File" className="w-4 h-4" /></span>
//               <div className="text-left">
//                 <p className="font-semibold">Word Document</p>
//                 <p className="text-xs text-gray-400">Best for editing text</p>
//               </div>
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
































// // ExportTable.jsx
// import React, { useState, useRef, useEffect } from "react";
// import { saveAs } from "file-saver";
// import * as XLSX from "xlsx";
// import "jspdf-autotable";
// import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from "docx";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import Icon from "./Icon"; 

// // Access Base URL if needed (ensure this matches your .env)
// const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8000";

// // --- Helper: Convert Image URL to Base64 ---
// const getBase64ImageFromURL = (url) => {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.crossOrigin = "Anonymous";
//     // Handle relative paths by prepending BASE_URL
//     img.src = url.startsWith("http") ? url : `${BASE_URL}${url}`;
//     img.onload = () => {
//       const canvas = document.createElement("canvas");
//       canvas.width = img.width;
//       canvas.height = img.height;
//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(img, 0, 0);
//       try {
//         const dataURL = canvas.toDataURL("image/jpeg");
//         resolve(dataURL);
//       } catch (e) {
//         // If CORS fails, resolve null so we just skip the image
//         console.warn("CORS blocked image export:", url);
//         resolve(null);
//       }
//     };
//     img.onerror = () => resolve(null); // Resolve null on error to keep going
//   });
// };

// const flattenObject = (obj, parentKey = "", result = {}) => {
//   if (obj === null || typeof obj !== "object") return result;
//   for (const key in obj) {
//     if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
//     const newKey = parentKey ? `${parentKey}_${key}` : key;
//     const value = obj[key];
//     if (Array.isArray(value)) {
//       value.forEach((v, i) => {
//         if (typeof v === "object" && v !== null) {
//           flattenObject(v, `${newKey}_${i}`, result);
//         } else {
//           result[`${newKey}_${i}`] = v;
//         }
//       });
//     } else if (typeof value === "object" && value !== null) {
//       flattenObject(value, newKey, result);
//     } else {
//       result[newKey] = value;
//     }
//   }
//   return result;
// };

// // --- Updated Format Row (Now Includes Images) ---
// const formatRow = (flatRow, bodyStructure, keys) => {
//   const row = [];
//   bodyStructure.forEach((count, index) => {
//     const keySet = keys[index];
    
//     // 1. We removed the "pic" filter. Now image paths are included!
//     // We map all values to a string.
//     const values = keySet.map((k) => flatRow[k] ?? "").join("\n");
//     row.push(values);
//   });
//   return row;
// };

// // --- Main Component ---
// export default function ExportTable({
//   data = [],
//   title = [],
//   bodyStructure = [],
//   keys = [],
//   fileName = "Report",
// }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [isGenerating, setIsGenerating] = useState(false); // Loading state for PDF
//   const dropdownRef = useRef(null);

//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const flattenedData = data.map((d) => flattenObject(d));
//   // Standard formatted data (URLs are just strings here)
//   const formattedData = flattenedData.map((row) => formatRow(row, bodyStructure, keys));

//   // --- PDF Export Logic with Images ---
//   const exportPDF = async () => {
//     setIsOpen(false);
//     setIsGenerating(true);

//     // 1. Pre-process: Find image URLs and convert to Base64
//     // We assume any string containing extensions like .jpg, .png, .jpeg is an image
//     const processedData = await Promise.all(
//       formattedData.map(async (row) => {
//         return Promise.all(
//           row.map(async (cellContent) => {
//             const lines = cellContent.split("\n");
//             // Check if any line looks like an image URL
//             const imageLineIndex = lines.findIndex(line => 
//                /\.(jpeg|jpg|png|webp)$/i.test(line) || 
//                line.includes("/media/") // Specific to your Django backend
//             );

//             if (imageLineIndex !== -1) {
//               const url = lines[imageLineIndex];
//               const base64 = await getBase64ImageFromURL(url);
//               // Attach the Base64 to the cell string using a unique separator
//               if (base64) {
//                 // Remove the raw URL from text and append the Base64 hidden tag
//                 lines.splice(imageLineIndex, 1);
//                 return { 
//                     text: lines.join("\n"), 
//                     image: base64 
//                 };
//               }
//             }
//             return cellContent; // Return original if no image found
//           })
//         );
//       })
//     );

//     const doc = new jsPDF("p", "pt", "a4");
    
//     // Header
//     doc.setFontSize(18);
//     doc.setTextColor(40, 40, 40);
//     doc.text(fileName, 40, 40);
//     doc.setFontSize(10);
//     doc.setTextColor(100, 100, 100);
//     doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 55);

//     autoTable(doc, {
//       head: [title],
//       body: processedData.map(row => row.map(cell => (typeof cell === 'object' ? cell.text : cell))), // Pass only text to body initially
//       startY: 70,
//       theme: 'grid',
//       styles: {
//         fontSize: 9,
//         cellPadding: 8,
//         valign: 'middle',
//         overflow: 'linebreak',
//         minCellHeight: 30, // Ensure height for images
//       },
//       headStyles: {
//         fillColor: [30, 41, 59],
//         textColor: 255,
//         fontStyle: 'bold',
//       },
//       alternateRowStyles: {
//         fillColor: [248, 250, 252],
//       },
      
//       // --- The Magic: Render Image in Cell ---
//       didDrawCell: function (data) {
//         if (data.section === 'body' && data.column.index === 0) { // Assuming First Column is 'User'
//             const rawRow = processedData[data.row.index];
//             const cellData = rawRow[data.column.index];

//             // If we processed this cell as an object with an image
//             if (typeof cellData === 'object' && cellData.image) {
//                 const imgSize = 24; // Size of the profile pic
//                 const xPos = data.cell.x + 5; // Left padding
//                 const yPos = data.cell.y + (data.cell.height / 2) - (imgSize / 2); // Center vertically
                
//                 // Draw the Image
//                 doc.addImage(cellData.image, 'JPEG', xPos, yPos, imgSize, imgSize);
//             }
//         }
//       },
      
//       // Shift text to the right in the first column to make room for the image
//       willDrawCell: function(data) {
//           if (data.section === 'body' && data.column.index === 0) {
//              const rawRow = processedData[data.row.index];
//              const cellData = rawRow[data.column.index];
//              if (typeof cellData === 'object' && cellData.image) {
//                  // Push text over by 35pts
//                  data.cell.styles.cellPadding = { top: 8, bottom: 8, left: 35, right: 8 };
//              }
//           }
//       },
//       margin: { top: 60, left: 40, right: 40, bottom: 40 },
//     });

//     doc.save(`${fileName}.pdf`);
//     setIsGenerating(false);
//   };

//   // --- Excel & Docx (Keep Standard Text) ---
//   const exportExcel = () => {
//     // For Excel, we strip the raw URL to keep it clean, or keep it if you prefer
//     const cleanData = formattedData.map(row => row.map(cell => cell.replace(/(\S+\.(jpg|png|jpeg)|(\/media\/\S+))/gi, "").trim()));
//     const ws = XLSX.utils.aoa_to_sheet([title, ...cleanData]);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
//     XLSX.writeFile(wb, `${fileName}.xlsx`);
//     setIsOpen(false);
//   };

//   const exportDOCX = async () => {
//     // Basic DOCX (Text only for now)
//     const tableRows = [
//       new TableRow({
//         children: title.map((t) =>
//           new TableCell({
//             width: { size: 100 / title.length, type: WidthType.PERCENTAGE },
//             children: [new Paragraph({ text: t, bold: true })],
//           })
//         ),
//       }),
//       ...formattedData.map((row) =>
//         new TableRow({
//           children: row.map((cell) =>
//             new TableCell({
//               children: [new Paragraph({ text: cell.replace(/(\S+\.(jpg|png|jpeg)|(\/media\/\S+))/gi, "").trim() })],
//             })
//           ),
//         })
//       ),
//     ];
//     const doc = new Document({
//       sections: [{ children: [new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } })] }],
//     });
//     const blob = await Packer.toBlob(doc);
//     saveAs(blob, `${fileName}.docx`);
//     setIsOpen(false);
//   };

//   return (
//     <div className="relative inline-block text-left" ref={dropdownRef}>
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         disabled={isGenerating}
//         className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors shadow-sm focus:outline-none dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed"
//       >
//         <Icon name="Download" className="w-5 h-5" />
//         <span className="font-medium">{isGenerating ? "Preparing..." : "Export"}</span>
//         {!isGenerating && (
//              <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//              </svg>
//         )}
//       </button>

//       {isOpen && !isGenerating && (
//         <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
//           <div className="py-1">
//             <button onClick={exportPDF} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 gap-3">
//               <span className="text-red-600"><Icon name="File" className="w-4 h-4" /></span> PDF Document
//             </button>
//             <button onClick={exportExcel} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 gap-3">
//               <span className="text-green-600"><Icon name="File" className="w-4 h-4" /></span> Excel Spreadsheet
//             </button>
//             <button onClick={exportDOCX} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 gap-3">
//               <span className="text-blue-600"><Icon name="File" className="w-4 h-4" /></span> Word Document
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






















































// // import React, { useState, useRef, useEffect } from "react";
// // import { saveAs } from "file-saver";
// // import * as XLSX from "xlsx";
// // import "jspdf-autotable";
// // import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from "docx";
// // import jsPDF from "jspdf";
// // import autoTable from "jspdf-autotable";
// // import Icon from "./Icon"; // Ensure this path is correct

// // // --- Helper Functions (Kept exactly as they were) ---
// // const flattenObject = (obj, parentKey = "", result = {}) => {
// //   if (obj === null || typeof obj !== "object") return result;
// //   for (const key in obj) {
// //     if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
// //     const newKey = parentKey ? `${parentKey}_${key}` : key;
// //     const value = obj[key];
// //     if (Array.isArray(value)) {
// //       value.forEach((v, i) => {
// //         if (typeof v === "object" && v !== null) {
// //           flattenObject(v, `${newKey}_${i}`, result);
// //         } else {
// //           result[`${newKey}_${i}`] = v;
// //         }
// //       });
// //     } else if (typeof value === "object" && value !== null) {
// //       flattenObject(value, newKey, result);
// //     } else {
// //       result[newKey] = value;
// //     }
// //   }
// //   return result;
// // };

// // const formatRow = (flatRow, bodyStructure, keys) => {
// //   const row = [];
// //   bodyStructure.forEach((count, index) => {
// //     const keySet = keys[index];
// //     const filteredKeys = keySet.filter((k) => !k.toLowerCase().includes("pic"));
// //     const values = filteredKeys.map((k) => flatRow[k] ?? "").join("\n");
// //     row.push(values);
// //   });
// //   return row;
// // };

// // // --- Main Component ---
// // export default function ExportTable({
// //   data = [],
// //   title = [],
// //   bodyStructure = [],
// //   keys = [],
// //   fileName = "Report",
// // }) {
// //   const [isOpen, setIsOpen] = useState(false);
// //   const dropdownRef = useRef(null);

// //   // Close dropdown if clicked outside
// //   useEffect(() => {
// //     function handleClickOutside(event) {
// //       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
// //         setIsOpen(false);
// //       }
// //     }
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => {
// //       document.removeEventListener("mousedown", handleClickOutside);
// //     };
// //   }, []);

// //   const flattenedData = data.map((d) => flattenObject(d));
// //   const formattedData = flattenedData.map((row) => formatRow(row, bodyStructure, keys));

// //   // const exportPDF = () => {
// //   //   const doc = new jsPDF("p", "pt");
// //   //   doc.setFontSize(10);
// //   //   autoTable(doc, {
// //   //     head: [title],
// //   //     body: formattedData,
// //   //     styles: { fontSize: 9, cellPadding: 4 },
// //   //     theme: "grid",
// //   //     startY: 20,
// //   //     margin: { top: 20, left: 10, right: 10 },
// //   //   });
// //   //   doc.save(`${fileName}.pdf`);
// //   //   setIsOpen(false);
// //   // };
// // const exportPDF = () => {
// //     const doc = new jsPDF("p", "pt", "a4"); // 'pt' points are easier for layout
    
// //     // --- 1. Add a Professional Header ---
// //     const pageWidth = doc.internal.pageSize.getWidth();
// //     doc.setFontSize(18);
// //     doc.setTextColor(40, 40, 40); // Dark Gray
// //     doc.text(fileName, 40, 40); // Title at top left
    
// //     doc.setFontSize(10);
// //     doc.setTextColor(100, 100, 100); // Lighter Gray
// //     const dateStr = new Date().toLocaleDateString();
// //     doc.text(`Generated on: ${dateStr}`, 40, 55);

// //     // --- 2. Advanced Table Styling ---
// //     autoTable(doc, {
// //       head: [title],
// //       body: formattedData,
// //       startY: 70, // Start below the custom header
// //       theme: 'grid', // 'striped', 'grid', or 'plain'
      
// //       // Global Styles
// //       styles: {
// //         fontSize: 9,
// //         font: "helvetica", // 'helvetica', 'times', 'courier'
// //         cellPadding: 8, // More breathing room
// //         overflow: 'linebreak', // Wrap text if it's too long
// //         valign: 'middle',
// //         halign: 'left',
// //         lineWidth: 0.5, // Thinner, cleaner borders
// //         lineColor: [200, 200, 200] // Light gray borders
// //       },

// //       // Header Specific Styles
// //       headStyles: {
// //         fillColor: [30, 41, 59], // Dark Slate (Matches your dashboard)
// //         textColor: [255, 255, 255], // White text
// //         fontStyle: 'bold',
// //         fontSize: 5,
// //         halign: 'left',
// //         lineWidth: 0 // No border on header cells looks cleaner
// //       },

// //       // Body (Row) Styles
// //       bodyStyles: {
// //         textColor: [50, 50, 50],
// //       },

// //       // Alternate Row Colors (Zebra Striping)
// //       alternateRowStyles: {
// //         fillColor: [248, 250, 252], // Very light gray/blue
// //       },

// //       // Column Specific Styles (Optional: Center the first column)
// //       // columnStyles: {
// //       //   0: { fontStyle: 'bold' } 
// //       // },
      
// //       // Footer/Margins
// //       margin: { top: 60, left: 40, right: 40, bottom: 40 },
      
// //       // Add Page Numbers
// //       didDrawPage: function (data) {
// //         // Footer text
// //         const str = 'Page ' + doc.internal.getNumberOfPages();
// //         doc.setFontSize(5);
// //         doc.text(str, data.settings.margin.left, doc.internal.pageSize.getHeight() - 20);
// //       }
// //     });

// //     doc.save(`${fileName}.pdf`);
// //     setIsOpen(false);
// //   };
// //   const exportExcel = () => {
// //     const ws = XLSX.utils.aoa_to_sheet([title, ...formattedData]);
// //     const wb = XLSX.utils.book_new();
// //     XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
// //     XLSX.writeFile(wb, `${fileName}.xlsx`);
// //     setIsOpen(false);
// //   };

// //   const exportDOCX = async () => {
// //     const tableRows = [
// //       new TableRow({
// //         children: title.map(
// //           (t) =>
// //             new TableCell({
// //               width: { size: 100 / title.length, type: WidthType.PERCENTAGE },
// //               children: [new Paragraph({ text: t, bold: true })],
// //             })
// //         ),
// //       }),
// //       ...formattedData.map(
// //         (row) =>
// //           new TableRow({
// //             children: row.map(
// //               (cell) =>
// //                 new TableCell({
// //                   children: [new Paragraph({ text: cell })],
// //                 })
// //             ),
// //           })
// //       ),
// //     ];

// //     const doc = new Document({
// //       sections: [
// //         {
// //           children: [
// //             new Table({
// //               rows: tableRows,
// //               width: { size: 100, type: WidthType.PERCENTAGE },
// //             }),
// //           ],
// //         },
// //       ],
// //     });

// //     const blob = await Packer.toBlob(doc);
// //     saveAs(blob, `${fileName}.docx`);
// //     setIsOpen(false);
// //   };

// //   return (
// //     <div className="relative inline-block text-left" ref={dropdownRef}>
// //       {/* Main Trigger Button */}
// //       <button
// //         onClick={() => setIsOpen(!isOpen)}
// //         className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:bg-slate-700 dark:hover:bg-slate-600"
// //       >
// //         <Icon name="Download" className="w-5 h-5" /> {/* Assuming 'Download' exists in your Icon set */}
// //         <span className="font-medium">Export</span>
// //         <svg
// //           className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
// //           fill="none"
// //           stroke="currentColor"
// //           viewBox="0 0 24 24"
// //         >
// //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
// //         </svg>
// //       </button>

// //       {/* Dropdown Menu */}
// //       {isOpen && (
// //         <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 origin-top-right transition transform ease-out duration-100 scale-100">
// //           <div className="py-1">
// //             <button
// //               onClick={exportPDF}
// //               className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3"
// //             >
// //               <span className="text-red-600"><Icon name="File" className="w-4 h-4" /></span>
// //               PDF Document
// //             </button>
// //             <button
// //               onClick={exportExcel}
// //               className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3"
// //             >
// //               <span className="text-green-600"><Icon name="File" className="w-4 h-4" /></span>
// //               Excel Spreadsheet
// //             </button>
// //             <button
// //               onClick={exportDOCX}
// //               className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 gap-3"
// //             >
// //               <span className="text-blue-600"><Icon name="File" className="w-4 h-4" /></span>
// //               Word Document
// //             </button>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }