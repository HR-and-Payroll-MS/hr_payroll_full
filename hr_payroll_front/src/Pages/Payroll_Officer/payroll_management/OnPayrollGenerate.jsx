import { createRoot } from "react-dom/client";
import React, { useRef, useState } from "react";
import PayslipTemplate from "../../../Components/PayslipTemplate";
import { generatePdfBlobFromElement } from "../../../utils/pdf";
import PayslipList from "../../../Components/PayslipList";
import Table from "../../../Components/Table";
import calcPayrollForEmployee from "./calcPayrollForEmployee";
import ViewerLoader from "./ViewerLoader";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";
import Header from "../../../Components/Header";
import { Generatepayroll } from "../../../Components/Level2Hearder";
// import ExportTable from "../../../Components/ExportTable";
const demoEmployees = [
  { id: "EMP001", name: "John Doe", department: "Finance", jobTitle: "Accountant", bankAccount: "0011223344" },
  { id: "EMP002", name: "Mary Smith", department: "HR", jobTitle: "HR Officer", bankAccount: "9988776655" },
  { id: "EMP003", name: "Ali Mohammed", department: "IT", jobTitle: "Developer", bankAccount: "2233445566" },
];
const key =[['id'], ['name'],[ 'department'], ['jobTitle'], ['bankAccount']];
const title=['Employee ID', 'Name', 'Department', 'Job Title', 'Bank Account','Actions'];
const structure=[1,1,1,1,1,64];
export default function OnPayrollGenerate({
  progress,
  setProgress,
  summary,
  setSummary
  
}) {
  const [empid, setEmpid] = useState("");
  const printRef = useRef();
  const [popup,setpopup]= useState(false)
  const [processing, setProcessing] = useState(false);
  const [employees] = useState(demoEmployees);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

// map over all employees and sum up the net pay and store in summary state
  async function handlePreviewAndSummary() {
    const payrolls = employees.map((e) => calcPayrollForEmployee(e, month));
    console.log(payrolls);
    const totalPayout = payrolls.reduce((s, p) => s + p.net, 0);
    // const missing = payrolls.filter((p) => !p.employee.bankAccount).length;
    setSummary(
      { totalEmployees: payrolls.length,
         totalPayout,
          // missing,
          payrolls });
          setpopup(false)
  }
async function handleGenerateConfirmed() {
  if (!summary?.payrolls?.length) {
    alert("No payroll data to process.");
    return;
  }

  setProcessing(true);
  setProgress("Generating and uploading payslips...");

  let count = 0;
  const total = summary.payrolls.length;

  try {
    for (const p of summary.payrolls) {
      count++;
      setProgress(`Processing ${count}/${total}: ${p.employee.name}`);

      // === Offscreen rendering (same as before) ===
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;background:white;";
      document.body.appendChild(container);

      const root = createRoot(container);
      root.render(<PayslipTemplate payroll={p} month={p.month} />);

      await document.fonts.ready;
      let node = container.firstElementChild;
      while (!node) {
        await new Promise(r => requestAnimationFrame(r));
        node = container.firstElementChild;
      }
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const blob = await generatePdfBlobFromElement(node);

      // === UPLOAD PDF DIRECTLY TO DJANGO USING FormData ===
      const formData = new FormData();
      formData.append("pdf_file", blob, `payslip_${p.employee.id}_${p.month}.pdf`);
      formData.append("employee_id", p.employee.id);
      formData.append("month", p.month);
      formData.append("gross", p.gross.toString());
      formData.append("net", p.net.toString());

      // This calls your Django endpoint
      await axios.post("/api/payslips/generate/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          // Add auth if needed (JWT, session, etc.)
          // Authorization: `Bearer ${token}`,
        },
      });

      // Cleanup DOM
      root.unmount();
      document.body.removeChild(container);

      // Prevent browser freeze on large batches
      if (count % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }

    setProgress(`Success! All ${total} payslips generated and saved.`);
    alert(`Payroll processed successfully!\n${total} payslips uploaded to server.`);
    
  } catch (err) {
    console.error("Payslip generation failed:", err);
    const msg = err.response?.data?.detail || err.message || "Unknown error";
    alert(`Failed at employee ${count}: ${msg}`);
    setProgress("Error occurred");
  } finally {
    setProcessing(false);
    setTimeout(() => setProgress(""), 6000);
  }
}

  return (
    <>
      <Header Title={"Generate Payroll"}/>
       <Generatepayroll  message={summary?"Generate payslips for all employees? This will replace existing payslips for this month.":"Preview summary first."}   noCancel={summary?false:true} confirmText={summary?"Generate Payroll":"Preview Summary"}  onDateClick={setMonth} text={summary?null:"Preview Summary"} icon={summary?null:"Eye"} popup={summary?popup:false} setpopup={summary?setpopup:handlePreviewAndSummary} action={handleGenerateConfirmed}/>
    <div className=" overflow-auto">
      <div className="flex gap-6">
        <div className="flex-1 space-y-4">
          <div className="  rounded ">
            {console.log("demo employee data",demoEmployees)}
            <Table components={ ViewerLoader} D1={month} Data={demoEmployees} Structure={structure} ke={key} title={title}/>
          </div>
        
        </div>
{processing && (
  <div style={{
    position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
    background: "#333", color: "white", padding: "12px 24px",
    borderRadius: 8, zIndex: 9999, fontSize: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
  }}>
    {progress || "Processing..."}
  </div>
)}
        <aside className="space-y-4">  
         
          <div className="p-4 shadow bg-slate-50 rounded">
            <h3 className="font-semibold mb-2">Summary (Preview)</h3>
            {!summary && <div className="text-sm text-slate-500">Click "Preview Summary" to view payroll totals.</div>}
            {summary && (
              <div>
                <div className="text-sm">
                  Employees: <strong>{summary.totalEmployees}</strong>
                </div>
                <div className="text-sm">
                  Total Payroll (Net): <strong>{summary.totalPayout.toLocaleString()}</strong>
                </div>
                <div className="text-sm">
                  Missing bank info: <strong>{summary.missing}</strong>
                </div>
                <div className="mt-2">
                  <button onClick={() => handleGenerateConfirmed()} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                    Confirm Generate
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

      </div>
    </div></>
  );
}

























// async function handleGenerateConfirmed() {
//   if (!summary?.payrolls?.length) {
//     alert("No payroll data to generate.");
//     return;
//   }

//   setProcessing(true);
//   setProgress("Starting payslip generation...");

//   const zip = new JSZip(); // For optional bulk download
//   let count = 0;
//   const total = summary.payrolls.length;

//   try {
//     for (const p of summary.payrolls) {
//       count++;
//       setProgress(`Generating payslip ${count} of ${total}: ${p.employee.name}`);

//       // Create offscreen container
//       const container = document.createElement("div");
//       container.style.position = "fixed";
//       container.style.left = "-9999px";
//       container.style.top = "0";
//       container.style.width = "800px";
//       container.style.background = "white";
//       document.body.appendChild(container);

//       const root = createRoot(container);
//      root.render(<PayslipTemplate payroll={p} month={p.month} />);

// // Wait for the component to be fully mounted and rendered
// let node = container.firstElementChild;

// await document.fonts.ready;

// // Double rAF + small fallback loop — this is the gold standard
// await new Promise((resolve) => {
//   const check = () => {
//     node = container.firstElementChild;
//     if (node) {
//       resolve();
//     } else {
//       requestAnimationFrame(check);
//     }
//   };
//   requestAnimationFrame(check);
// });

// // Final safety: wait one more frame after node exists
// await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

//       // Generate PDF blob
//       const blob = await generatePdfBlobFromElement(node);

//       // Unique filename
//       const filename = `Payslip_${p.employee.id}_${p.employee.name.replace(/\s+/g, "_")}_${p.month}.pdf`;
//       const storageKey = `${p.employee.id}_${p.month}`;

//       // Save to IndexedDB (optional - uncomment if using idb-keyval or similar)
//       // await idbPut(storageKey, blob);

//       // Add to ZIP for bulk download
//       zip.file(filename, blob);

//       // Cleanup
//       root.unmount();
//       document.body.removeChild(container);

//       // Small delay to prevent browser freeze on large batches (>100)
//       if (count % 10 === 0) await new Promise((r) => setTimeout(r, 0));
//     }

//     // ALL DONE!
//     setProgress(`Completed! Generated ${total} payslips.`);

//     // Option 1: Offer ZIP download
//     const zipBlob = await zip.generateAsync({ type: "blob" });
//     saveAs(zipBlob, `Payslips_${summary.month}_Batch_${new Date().toISOString().slice(0,10)}.zip`);

//     alert(`Success! ${total} payslips generated and downloaded as ZIP.`);

//     // Option 2: Just show success (if you prefer individual storage only)
//     // alert(`All ${total} payslips generated and saved locally.`);

//   } catch (err) {
//     console.error("Payslip generation failed:", err);
//     setProgress("Error occurred");
//     alert(`Failed at payslip ${count}: ${err.message || err}`);
//   } finally {
//     setProcessing(false);
//     setTimeout(() => setProgress(""), 5000); // Clear progress after 5 sec
//   }
// }