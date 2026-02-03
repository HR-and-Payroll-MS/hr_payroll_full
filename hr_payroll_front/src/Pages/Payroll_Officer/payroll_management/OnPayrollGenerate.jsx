import { createRoot } from 'react-dom/client';
import React, { useEffect, useRef, useState } from 'react';
import PayslipTemplate from '../../../Components/PayslipTemplate';
import { generatePdfBlobFromElement } from '../../../utils/pdf';
import ViewerLoader from './ViewerLoader';
import axios from 'axios';
import Header from '../../../Components/Header';
import { Generatepayroll } from '../../../Components/Level2Hearder';
import useAuth from '../../../Context/AuthContext';

export default function OnPayrollGenerate({
  progress,
  setProgress,
  summary,
  setSummary,
}) {
  const { axiosPrivate } = useAuth();
  const printRef = useRef();
  const [popup, setpopup] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [periodId, setPeriodId] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const monthName = new Date(`${month}-01`).toLocaleString('en-US', {
    month: 'long',
  });
  const year = new Date(`${month}-01`).getFullYear();

  useEffect(() => {
    fetchPeriodAndPayslips();
  }, [month]);

  async function fetchPeriodAndPayslips() {
    setLoading(true);
    setError('');
    try {
      const periodRes = await axiosPrivate.get(`/payroll/periods/`, {
        params: { month: monthName, year },
      });
      const periods = periodRes.data || [];
      if (!periods.length) {
        setPayslips([]);
        setSelectedPayslip(null);
        setPeriodId(null);
        setSummary(null);
        setError(`No payroll period found for ${monthName} ${year}.`);
        return;
      }

      const pid = periods[0].id;
      setPeriodId(pid);

      const payslipRes = await axiosPrivate.get(`/payroll/payslips/`, {
        params: { period: pid },
      });
      const data = payslipRes.data || [];
      setPayslips(data);
      setSelectedPayslip(data[0] || null);
      setSummary({
        totalEmployees: data.length,
        totalPayout: data.reduce((sum, p) => sum + Number(p.net_pay || 0), 0),
        payrolls: data,
      });
    } catch (err) {
      console.error('Failed to load payslips', err);
      setError(
        err?.response?.data?.detail || err.message || 'Failed to load payslips',
      );
      setPayslips([]);
      setSelectedPayslip(null);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }
  async function handleGenerateConfirmed() {
    if (!summary?.payrolls?.length) {
      alert('No payroll data to process.');
      return;
    }

    setProcessing(true);
    setProgress('Generating and uploading payslips...');

    let count = 0;
    const total = summary.payrolls.length;

    try {
      for (const p of summary.payrolls) {
        count++;
        setProgress(`Processing ${count}/${total}: ${p.employee.name}`);

        // === Offscreen rendering (same as before) ===
        const container = document.createElement('div');
        container.style.cssText =
          'position:fixed;left:-9999px;top:0;width:800px;background:white;';
        document.body.appendChild(container);

        const root = createRoot(container);
        root.render(<PayslipTemplate payroll={p} month={p.month} />);

        await document.fonts.ready;
        let node = container.firstElementChild;
        while (!node) {
          await new Promise((r) => requestAnimationFrame(r));
          node = container.firstElementChild;
        }
        await new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        );

        const blob = await generatePdfBlobFromElement(node);

        // === UPLOAD PDF DIRECTLY TO DJANGO USING FormData ===
        const formData = new FormData();
        formData.append(
          'pdf_file',
          blob,
          `payslip_${p.employee.id}_${p.month}.pdf`,
        );
        formData.append('employee_id', p.employee);
        formData.append('payslip_id', p.id);
        formData.append('period_id', periodId);
        formData.append('gross', (p.gross_pay || 0).toString());
        formData.append('net', (p.net_pay || 0).toString());

        // This calls your Django endpoint
        await axios.post('/api/payslips/generate/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            // Add auth if needed (JWT, session, etc.)
            // Authorization: `Bearer ${token}`,
          },
        });

        // Cleanup DOM
        root.unmount();
        document.body.removeChild(container);

        // Prevent browser freeze on large batches
        if (count % 10 === 0) await new Promise((r) => setTimeout(r, 0));
      }

      setProgress(`Success! All ${total} payslips generated and saved.`);
      alert(
        `Payroll processed successfully!\n${total} payslips uploaded to server.`,
      );
    } catch (err) {
      console.error('Payslip generation failed:', err);
      const msg = err.response?.data?.detail || err.message || 'Unknown error';
      alert(`Failed at employee ${count}: ${msg}`);
      setProgress('Error occurred');
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(''), 6000);
    }
  }

  return (
    <>
      <Header Title={'Generate Payroll'} />
      <Generatepayroll
        message={
          summary
            ? 'Generate payslips for all employees? This will replace existing payslips for this month.'
            : 'Load payslips first.'
        }
        noCancel={summary ? false : true}
        confirmText={summary ? 'Generate Payroll' : 'Reload Payslips'}
        onDateClick={setMonth}
        text={summary ? null : 'Reload Payslips'}
        icon={summary ? null : 'Eye'}
        popup={summary ? popup : false}
        setpopup={summary ? setpopup : fetchPeriodAndPayslips}
        action={handleGenerateConfirmed}
      />
      <div className=" overflow-auto">
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            <div className="rounded border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">
                  Payslips for {monthName} {year}
                </h3>
                {loading && (
                  <span className="text-xs text-slate-500">Loading…</span>
                )}
              </div>
              {error && (
                <div className="text-sm text-red-600 mb-2">{error}</div>
              )}
              {!payslips.length && !loading && (
                <div className="text-sm text-slate-500">
                  No payslips loaded.
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-3">
                {payslips.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPayslip(p)}
                    className={`text-left p-3 rounded border transition-colors ${
                      selectedPayslip?.id === p.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-sm font-semibold">
                      {p.employee_name || p.employee_id_display}
                    </div>
                    <div className="text-xs text-slate-500">
                      {p.department || ''}
                    </div>
                    <div className="text-xs text-slate-500">
                      Net: {Number(p.net_pay || 0).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {selectedPayslip && (
              <div className="rounded border border-slate-200 dark:border-slate-700 p-4">
                <ViewerLoader payslip={selectedPayslip} month={month} />
              </div>
            )}
          </div>
          {processing && (
            <div
              style={{
                position: 'fixed',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#333',
                color: 'white',
                padding: '12px 24px',
                borderRadius: 8,
                zIndex: 9999,
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {progress || 'Processing...'}
            </div>
          )}
          <aside className="space-y-4">
            <div className="p-4 shadow bg-slate-50 rounded">
              <h3 className="font-semibold mb-2">Summary (Preview)</h3>
              {!summary && (
                <div className="text-sm text-slate-500">
                  Load payslips to view totals.
                </div>
              )}
              {summary && (
                <div>
                  <div className="text-sm">
                    Employees: <strong>{summary.totalEmployees}</strong>
                  </div>
                  <div className="text-sm">
                    Total Payroll (Net):{' '}
                    <strong>{summary.totalPayout.toLocaleString()}</strong>
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={() => handleGenerateConfirmed()}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                    >
                      Confirm Generate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
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
