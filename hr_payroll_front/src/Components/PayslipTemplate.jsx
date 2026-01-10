import React, { forwardRef, useState, useImperativeHandle, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { saveAs } from "file-saver";
import { generatePdfBlobFromElement } from "../utils/pdf";

// Added isPdfView prop to control visibility of buttons during export
const PayslipTemplate = forwardRef(({ payroll, isEditable = false, onSave, isPdfView = false }, ref) => {
  const [isEditing, setIsEditing] = useState(isEditable);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize state with payroll data
  const [editedData, setEditedData] = useState({
    ...payroll,
    earnings: Array.isArray(payroll?.earnings) ? payroll.earnings : [],
    deductions: Array.isArray(payroll?.deductions) ? payroll.deductions : [],
  });

  // Sync state if the 'payroll' prop changes from the parent
  useEffect(() => {
    if (payroll) {
      setEditedData({
        ...payroll,
        earnings: Array.isArray(payroll?.earnings) ? payroll.earnings : [],
        deductions: Array.isArray(payroll?.deductions) ? payroll.deductions : [],
      });
    }
  }, [payroll]);

  const originalData = {
    ...payroll,
    earnings: Array.isArray(payroll?.earnings) ? payroll.earnings : [],
    deductions: Array.isArray(payroll?.deductions) ? payroll.deductions : [],
  };

  useImperativeHandle(ref, () => ({
    startEditing: () => setIsEditing(true),
    cancelEditing: handleCancel,
    save: handleSave,
  }));

  const handleChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEarningsChange = (index, subfield, value) => {
    const newEarnings = [...editedData.earnings];
    newEarnings[index] = { ...newEarnings[index], [subfield]: value };
    setEditedData((prev) => ({ ...prev, earnings: newEarnings }));
  };

  const handleDeductionsChange = (index, subfield, value) => {
    const newDeductions = [...editedData.deductions];
    newDeductions[index] = { ...newDeductions[index], [subfield]: value };
    setEditedData((prev) => ({ ...prev, deductions: newDeductions }));
  };

  const recalculateTotals = (data) => {
    const gross = (Array.isArray(data.earnings) ? data.earnings : []).reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );
    const totalDeductions = (Array.isArray(data.deductions) ? data.deductions : []).reduce(
      (sum, d) => sum + Number(d.amount || 0),
      0
    );
    const net = gross - totalDeductions;
    return { gross, totalDeductions, net };
  };

  const handleSave = () => {
    const { gross, totalDeductions, net } = recalculateTotals(editedData);
    const finalData = {
      ...editedData,
      gross,
      totalDeductions,
      net,
    };
    setEditedData(finalData);
    setIsEditing(false);
    if (onSave) onSave(finalData);
  };

  const handleCancel = () => {
    setEditedData(originalData);
    setIsEditing(false);
  };

  // === PDF Export FUNCTION ===
  const handleExportPdf = async () => {
    if (!editedData) return; // Check against editedData to ensure we export current state
    setIsExporting(true);

    try {
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;background:white;";
      document.body.appendChild(container);

      const root = createRoot(container);
      
      // FIX: Pass 'editedData' (not 'payroll') so edits are included
      // FIX: Pass 'isPdfView={true}' to hide buttons
      root.render(
        <PayslipTemplate 
          payroll={editedData} 
          isEditable={false} 
          isPdfView={true} 
        />
      );

      await document.fonts.ready;
      let node = container.firstElementChild;
      while (!node) {
        await new Promise((r) => requestAnimationFrame(r));
        node = container.firstElementChild;
      }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const blob = await generatePdfBlobFromElement(node);
      saveAs(blob, `payslip_${editedData.employee?.id || 'emp'}_${editedData.month || 'current'}.pdf`);

      root.unmount();
      document.body.removeChild(container);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF: " + (err.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  if (!editedData) return null;

  // FIX: Always use editedData for display. 
  // Since we initialize it with payroll and update it on save, it is the source of truth.
  const displayData = editedData;

  const {
    company,
    employee,
    month,
    earnings,
    deductions,
    gross,
    totalDeductions,
    net,
    paymentMethod,
    paymentDate,
  } = displayData;

  // Calculate live totals for the view
  const currentTotals = recalculateTotals(displayData);
  const displayGross = isEditing ? currentTotals.gross : gross;
  const displayTotalDeductions = isEditing ? currentTotals.totalDeductions : totalDeductions;
  const displayNet = isEditing ? currentTotals.net : net;

  const safeEarnings = Array.isArray(earnings) ? earnings : [];
  const safeDeductions = Array.isArray(deductions) ? deductions : [];

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        margin: "0 auto",
        backgroundColor: "white",
        borderRadius: "0.5rem",
        padding: "1.5rem",
        color: "rgb(30,30,30)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Edit buttons - Hidden if in PDF View */}
      {isEditing && !isPdfView && (
        <div style={{ display: "flex", justifyContent: "end", gap: "0.5rem", padding: "1rem 0" }}>
          <button
            onClick={handleSave}
            style={{
              padding: "0.5rem 0.51rem",
              backgroundColor: "#1d293d",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
            }}
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            style={{
              padding: "0.5rem 0.51rem",
              backgroundColor: "#6a7282",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Export PDF Button - Hidden if editing OR if in PDF View */}
      {!isEditing && !isPdfView && (
        <div
          style={{
            display: "flex",
            justifyContent: "end",
            gap: "0.5rem",
            padding: "1rem 0",
            "@media print": { display: "none" },
          }}
        >
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            style={{
              padding: "0.5rem 0.51rem",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: isExporting ? "not-allowed" : "pointer",
            }}
          >
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="logo" style={{ width: "64px", height: "64px", objectFit: "contain" }} />
          ) : (
            <div style={{ width: "64px", height: "64px", backgroundColor: "rgb(226,232,240)", borderRadius: "0.25rem" }} />
          )}
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{company?.name || "Company Name"}</h1>
            <div style={{ fontSize: "0.875rem" }}>{company?.address}</div>
            <div style={{ fontSize: "0.75rem", color: "rgb(100,116,139)" }}>
              {company?.phone} • {company?.email}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.875rem", color: "rgb(100,116,139)" }}>Payslip for</div>
          <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>{month}</div>
          <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>Payslip ID: {`${employee?.id}-${month}`}</div>
        </div>
      </div>

      {/* Employee & Payment Info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        {/* Employee Details */}
        <div>
          <h3 style={{ fontWeight: 600 }}>Employee Details</h3>
          <table style={{ fontSize: "0.875rem" }}>
            <tbody>
              <tr>
                <td style={{ paddingRight: "0.5rem" }}>Name:</td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={employee?.name}
                      onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, name: e.target.value } }))}
                      style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
                    />
                  ) : (
                    employee?.name
                  )}
                </td>
              </tr>
              <tr><td style={{ paddingRight: "0.5rem" }}>Employee ID:</td><td>{employee?.id}</td></tr>
              <tr>
                <td style={{ paddingRight: "0.5rem" }}>Department:</td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={employee?.department || ""}
                      onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, department: e.target.value } }))}
                      style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
                    />
                  ) : (
                    employee?.department || "-"
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ paddingRight: "0.5rem" }}>Job Title:</td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={employee?.jobTitle || ""}
                      onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, jobTitle: e.target.value } }))}
                      style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
                    />
                  ) : (
                    employee?.jobTitle
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Info */}
        <div>
          <h3 style={{ fontWeight: 600 }}>Payment Info</h3>
          <table style={{ fontSize: "0.875rem" }}>
            <tbody>
              <tr>
                <td style={{ paddingRight: "0.5rem" }}>Payment Method:</td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={paymentMethod}
                      onChange={(e) => handleChange("paymentMethod", e.target.value)}
                      style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
                    />
                  ) : (
                    paymentMethod
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ paddingRight: "0.5rem" }}>Payment Date:</td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={paymentDate}
                      onChange={(e) => handleChange("paymentDate", e.target.value)}
                      style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
                    />
                  ) : (
                    paymentDate
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ paddingRight: "0.5rem" }}>Bank Account:</td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={employee?.bankAccount || ""}
                      onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, bankAccount: e.target.value } }))}
                      style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
                    />
                  ) : (
                    employee?.bankAccount || "-"
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Earnings & Deductions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ backgroundColor: "rgb(248,250,252)", padding: "0.75rem", borderRadius: "0.25rem" }}>
          <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Earnings</h4>
          <table style={{ width: "100%", fontSize: "0.875rem" }}>
            <tbody>
              {safeEarnings.map((e, idx) => (
                <tr key={idx}>
                  <td style={{ width: "75%" }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={e.label || ""}
                        onChange={(ev) => handleEarningsChange(idx, "label", ev.target.value)}
                        style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100%" }}
                      />
                    ) : (
                      e.label || "-"
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={e.amount || 0}
                        onChange={(ev) => handleEarningsChange(idx, "amount", Number(ev.target.value) || 0)}
                        style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100px", textAlign: "right" }}
                      />
                    ) : (
                      (Number(e.amount) || 0).toLocaleString()
                    )}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "1px solid #ccc", fontWeight: 600 }}>
                <td>Total Earnings</td>
                <td style={{ textAlign: "right" }}>{(Number(displayGross) || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ backgroundColor: "rgb(248,250,252)", padding: "0.75rem", borderRadius: "0.25rem" }}>
          <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Deductions</h4>
          <table style={{ width: "100%", fontSize: "0.875rem" }}>
            <tbody>
              {safeDeductions.map((d, idx) => (
                <tr key={idx}>
                  <td style={{ width: "75%" }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={d.label || ""}
                        onChange={(ev) => handleDeductionsChange(idx, "label", ev.target.value)}
                        style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100%" }}
                      />
                    ) : (
                      d.label || "-"
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={d.amount || 0}
                        onChange={(ev) => handleDeductionsChange(idx, "amount", Number(ev.target.value) || 0)}
                        style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100px", textAlign: "right" }}
                      />
                    ) : (
                      (Number(d.amount) || 0).toLocaleString()
                    )}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "1px solid #ccc", fontWeight: 600 }}>
                <td>Total Deductions</td>
                <td style={{ textAlign: "right" }}>{(Number(displayTotalDeductions) || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Gross & Net */}
      <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "0.25rem", backgroundColor: "rgb(249,250,251)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.875rem", color: "rgb(100,116,139)" }}>Gross Salary</div>
            <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>{displayGross.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "rgb(100,116,139)" }}>Net Pay</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "rgb(22,163,74)" }}>{displayNet.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "rgb(100,116,139)" }}>
          This is a computer-generated payslip and does not require a signature.
        </div>
      </div>
    </div>
  );
});

export default PayslipTemplate;







































// import React, { forwardRef, useState, useImperativeHandle } from "react";
// import { createRoot } from "react-dom/client";
// import { saveAs } from "file-saver";
// import { generatePdfBlobFromElement } from "../utils/pdf";

// const PayslipTemplate = forwardRef(({ payroll, isEditable = false, onSave }, ref) => {
//   const [isEditing, setIsEditing] = useState(isEditable);
//   const [isExporting, setIsExporting] = useState(false); // NEW: loading state for export
//   const [editedData, setEditedData] = useState({
//     ...payroll,
//     earnings: Array.isArray(payroll?.earnings) ? payroll.earnings : [],
//     deductions: Array.isArray(payroll?.deductions) ? payroll.deductions : [],
//   });
//   const originalData = {
//     ...payroll,
//     earnings: Array.isArray(payroll?.earnings) ? payroll.earnings : [],
//     deductions: Array.isArray(payroll?.deductions) ? payroll.deductions : [],
//   };

//   useImperativeHandle(ref, () => ({
//     startEditing: () => setIsEditing(true),
//     cancelEditing: handleCancel,
//     save: handleSave,
//   }));

//   const handleChange = (field, value) => {
//     setEditedData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleEarningsChange = (index, subfield, value) => {
//     const newEarnings = [...editedData.earnings];
//     newEarnings[index] = { ...newEarnings[index], [subfield]: value };
//     setEditedData((prev) => ({ ...prev, earnings: newEarnings }));
//   };

//   const handleDeductionsChange = (index, subfield, value) => {
//     const newDeductions = [...editedData.deductions];
//     newDeductions[index] = { ...newDeductions[index], [subfield]: value };
//     setEditedData((prev) => ({ ...prev, deductions: newDeductions }));
//   };

//   const recalculateTotals = (data) => {
//     const gross = (Array.isArray(data.earnings) ? data.earnings : []).reduce(
//       (sum, e) => sum + Number(e.amount || 0),
//       0
//     );
//     const totalDeductions = (Array.isArray(data.deductions) ? data.deductions : []).reduce(
//       (sum, d) => sum + Number(d.amount || 0),
//       0
//     );
//     const net = gross - totalDeductions;
//     return { gross, totalDeductions, net };
//   };

//   const handleSave = () => {
//     const { gross, totalDeductions, net } = recalculateTotals(editedData);
//     const finalData = {
//       ...editedData,
//       gross,
//       totalDeductions,
//       net,
//     };
//     setEditedData(finalData);
//     setIsEditing(false);
//     if (onSave) onSave(finalData);
//   };

//   const handleCancel = () => {
//     setEditedData(originalData);
//     setIsEditing(false);
//   };

//   // === NEW FUNCTION TO EXPORT PDF WITH LOADING ===
//   const handleExportPdf = async () => {
//     if (!payroll) return;

//     setIsExporting(true); // show loading
//     try {
//       // Offscreen container
//       const container = document.createElement("div");
//       container.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;background:white;";
//       document.body.appendChild(container);

//       const root = createRoot(container);
//       // Render only the payslip content without buttons
//       root.render(<PayslipTemplate payroll={payroll} isEditable={false} />);

//       await document.fonts.ready;
//       let node = container.firstElementChild;
//       while (!node) {
//         await new Promise((r) => requestAnimationFrame(r));
//         node = container.firstElementChild;
//       }
//       await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

//       const blob = await generatePdfBlobFromElement(node);
//       saveAs(blob, `payslip_${payroll.employee.id}_${payroll.month}.pdf`);

//       root.unmount();
//       document.body.removeChild(container);
//     } catch (err) {
//       console.error("PDF export failed:", err);
//       alert("Failed to export PDF: " + (err.message || "Unknown error"));
//     } finally {
//       setIsExporting(false); // hide loading
//     }
//   };

//   if (!payroll) return null;

//   const {
//     company,
//     employee,
//     month,
//     earnings,
//     deductions,
//     gross,
//     totalDeductions,
//     net,
//     paymentMethod,
//     paymentDate,
//   } = isEditing ? editedData : payroll;

//   const displayData = isEditing ? editedData : payroll;
//   const { gross: displayGross, totalDeductions: displayTotalDeductions, net: displayNet } =
//     isEditing ? recalculateTotals(displayData) : { gross, totalDeductions, net };

//   const safeEarnings = Array.isArray(earnings) ? earnings : [];
//   const safeDeductions = Array.isArray(deductions) ? deductions : [];

//   return (
//     <div
//       style={{
//         height: "100%",
//         overflowY: "auto",
//         margin: "0 auto",
//         backgroundColor: "white",
//         borderRadius: "0.5rem",
//         padding: "1.5rem ",
//         color: "rgb(30,30,30)",
//         boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
//         fontFamily: "sans-serif",
//         position: "relative",
//       }}
//     >
//       {/* Edit buttons */}
//       {isEditing && (
//         <div style={{ display: "flex", justifyContent: "end", gap: "0.5rem", padding: "1rem 0" }}>
//           <button
//             onClick={handleSave}
//             style={{
//               padding: "0.5rem 0.51rem",
//               backgroundColor: "#1d293d",
//               color: "white",
//               border: "none",
//               borderRadius: "0.25rem",
//               cursor: "pointer",
//             }}
//           >
//             Save
//           </button>
//           <button
//             onClick={handleCancel}
//             style={{
//               padding: "0.5rem 0.51rem",
//               backgroundColor: "#6a7282",
//               color: "white",
//               border: "none",
//               borderRadius: "0.25rem",
//               cursor: "pointer",
//             }}
//           >
//             Cancel
//           </button>
//         </div>
//       )}

//       {/* Export PDF Button when NOT editing */}
//       {!isEditing && (
//         <div style={{ display: "flex", justifyContent: "end", gap: "0.5rem", padding: "1rem 0" }}>
//           <button
//             onClick={handleExportPdf}
//             disabled={isExporting}
//             style={{
//               padding: "0.5rem 0.51rem",
//               backgroundColor: "#2563eb",
//               color: "white",
//               border: "none",
//               borderRadius: "0.25rem",
//               cursor: isExporting ? "not-allowed" : "pointer",
//             }}
//           >
//             {isExporting ? "Exporting..." : "Export PDF"}
//           </button>
//         </div>
//       )}
//       {/* Header */}
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
//         <div style={{ display: "flex", gap: "1rem" }}>
//           {company?.logoUrl ? (
//             <img src={company.logoUrl} alt="logo" style={{ width: "64px", height: "64px", objectFit: "contain" }} />
//           ) : (
//             <div style={{ width: "64px", height: "64px", backgroundColor: "rgb(226,232,240)", borderRadius: "0.25rem" }} />
//           )}
//           <div>
//             <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{company?.name || "Company Name"}</h1>
//             <div style={{ fontSize: "0.875rem" }}>{company?.address}</div>
//             <div style={{ fontSize: "0.75rem", color: "rgb(100,116,139)" }}>
//               {company?.phone} • {company?.email}
//             </div>
//           </div>
//         </div>
//         <div style={{ textAlign: "right" }}>
//           <div style={{ fontSize: "0.875rem", color: "rgb(100,116,139)" }}>Payslip for</div>
//           <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>{month}</div>
//           <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>Payslip ID: {`${employee?.id}-${month}`}</div>
//         </div>
//       </div>

//       {/* Employee & Payment Info */}
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
//         {/* Employee Details */}
//         <div>
//           <h3 style={{ fontWeight: 600 }}>Employee Details</h3>
//           <table style={{ fontSize: "0.875rem" }}>
//             <tbody>
//               <tr>
//                 <td style={{ paddingRight: "0.5rem" }}>Name:</td>
//                 <td>
//                   {isEditing ? (
//                     <input
//                       type="text"
//                       value={employee?.name}
//                       onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, name: e.target.value } }))}
//                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
//                     />
//                   ) : (
//                     employee?.name
//                   )}
//                 </td>
//               </tr>
//               <tr><td style={{ paddingRight: "0.5rem" }}>Employee ID:</td><td>{employee?.id}</td></tr>
//               <tr>
//                 <td style={{ paddingRight: "0.5rem" }}>Department:</td>
//                 <td>
//                   {isEditing ? (
//                     <input
//                       type="text"
//                       value={employee.department || ""}
//                       onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, department: e.target.value } }))}
//                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
//                     />
//                   ) : (
//                     employee?.department || "-"
//                   )}
//                 </td>
//               </tr>
//               <tr>
//                 <td style={{ paddingRight: "0.5rem" }}>Job Title:</td>
//                 <td>
//                   {isEditing ? (
//                     <input
//                       type="text"
//                       value={employee?.jobTitle || ""}
//                       onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, jobTitle: e.target.value } }))}
//                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
//                     />
//                   ) : (
//                     employee?.jobTitle
//                   )}
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>

//         {/* Payment Info */}
//         <div>
//           <h3 style={{ fontWeight: 600 }}>Payment Info</h3>
//           <table style={{ fontSize: "0.875rem" }}>
//             <tbody>
//               <tr>
//                 <td style={{ paddingRight: "0.5rem" }}>Payment Method:</td>
//                 <td>
//                   {isEditing ? (
//                     <input
//                       type="text"
//                       value={paymentMethod}
//                       onChange={(e) => handleChange("paymentMethod", e.target.value)}
//                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
//                     />
//                   ) : (
//                     paymentMethod
//                   )}
//                 </td>
//               </tr>
//               <tr>
//                 <td style={{ paddingRight: "0.5rem" }}>Payment Date:</td>
//                 <td>
//                   {isEditing ? (
//                     <input
//                       type="text"
//                       value={paymentDate}
//                       onChange={(e) => handleChange("paymentDate", e.target.value)}
//                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
//                     />
//                   ) : (
//                     paymentDate
//                   )}
//                 </td>
//               </tr>
//               <tr>
//                 <td style={{ paddingRight: "0.5rem" }}>Bank Account:</td>
//                 <td>
//                   {isEditing ? (
//                     <input
//                       type="text"
//                       value={employee.bankAccount || ""}
//                       onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, bankAccount: e.target.value } }))}
//                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
//                     />
//                   ) : (
//                     employee?.bankAccount || "-"
//                   )}
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Earnings & Deductions */}
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
//         <div style={{ backgroundColor: "rgb(248,250,252)", padding: "0.75rem", borderRadius: "0.25rem" }}>
//           <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Earnings</h4>
//           <table style={{ width: "100%", fontSize: "0.875rem" }}>
//             <tbody>
//               {safeEarnings.map((e, idx) => (
//                 <tr key={idx}>
//                   <td style={{ width: "75%" }}>
//                     {isEditing ? (
//                       <input
//                         type="text"
//                         value={e.label || ""}
//                         onChange={(ev) => handleEarningsChange(idx, "label", ev.target.value)}
//                         style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100%" }}
//                       />
//                     ) : (
//                       e.label || "-"
//                     )}
//                   </td>
//                   <td style={{ textAlign: "right" }}>
//                     {isEditing ? (
//                       <input
//                         type="number"
//                         value={e.amount || 0}
//                         onChange={(ev) => handleEarningsChange(idx, "amount", Number(ev.target.value) || 0)}
//                         style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100px", textAlign: "right" }}
//                       />
//                     ) : (
//                       (Number(e.amount) || 0).toLocaleString()
//                     )}
//                   </td>
//                 </tr>
//               ))}
//               <tr style={{ borderTop: "1px solid #ccc", fontWeight: 600 }}>
//                 <td>Total Earnings</td>
//                 <td style={{ textAlign: "right" }}>{(Number(displayGross) || 0).toLocaleString()}</td>
//               </tr>
//             </tbody>
//           </table>
//         </div>

//         <div style={{ backgroundColor: "rgb(248,250,252)", padding: "0.75rem", borderRadius: "0.25rem" }}>
//           <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Deductions</h4>
//           <table style={{ width: "100%", fontSize: "0.875rem" }}>
//             <tbody>
//               {safeDeductions.map((d, idx) => (
//                 <tr key={idx}>
//                   <td style={{ width: "75%" }}>
//                     {isEditing ? (
//                       <input
//                         type="text"
//                         value={d.label || ""}
//                         onChange={(ev) => handleDeductionsChange(idx, "label", ev.target.value)}
//                         style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100%" }}
//                       />
//                     ) : (
//                       d.label || "-"
//                     )}
//                   </td>
//                   <td style={{ textAlign: "right" }}>
//                     {isEditing ? (
//                       <input
//                         type="number"
//                         value={d.amount || 0}
//                         onChange={(ev) => handleDeductionsChange(idx, "amount", Number(ev.target.value) || 0)}
//                         style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100px", textAlign: "right" }}
//                       />
//                     ) : (
//                       (Number(d.amount) || 0).toLocaleString()
//                     )}
//                   </td>
//                 </tr>
//               ))}
//               <tr style={{ borderTop: "1px solid #ccc", fontWeight: 600 }}>
//                 <td>Total Deductions</td>
//                 <td style={{ textAlign: "right" }}>{(Number(displayTotalDeductions) || 0).toLocaleString()}</td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Gross & Net */}
//       <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "0.25rem", backgroundColor: "rgb(249,250,251)" }}>
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           <div>
//             <div style={{ fontSize: "0.875rem", color: "rgb(100,116,139)" }}>Gross Salary</div>
//             <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>{displayGross.toLocaleString()}</div>
//           </div>
//           <div>
//             <div style={{ fontSize: "0.875rem", color: "rgb(100,116,139)" }}>Net Pay</div>
//             <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "rgb(22,163,74)" }}>{displayNet.toLocaleString()}</div>
//           </div>
//         </div>
//         <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "rgb(100,116,139)" }}>
//           This is a computer-generated payslip and does not require a signature.
//         </div>
//       </div>
//     </div>
//   );
// });

// export default PayslipTemplate;










































































// import React, { forwardRef, useState, useImperativeHandle } from "react";

// const PayslipTemplate = forwardRef(({ payroll, isEditable = false, onSave }, ref) => {
//   const [isEditing, setIsEditing] = useState(isEditable);
//   const [editedData, setEditedData] = useState({
//     ...payroll,
//     earnings: Array.isArray(payroll?.earnings) ? payroll.earnings : [],
//     deductions: Array.isArray(payroll?.deductions) ? payroll.deductions : [],
//   });
//   const originalData = {
//     ...payroll,
//     earnings: Array.isArray(payroll?.earnings) ? payroll.earnings : [],
//     deductions: Array.isArray(payroll?.deductions) ? payroll.deductions : [],
//   };

//   useImperativeHandle(ref, () => ({
//     startEditing: () => setIsEditing(true),
//     cancelEditing: handleCancel,
//     save: handleSave,
//   }));

//   const handleChange = (field, value) => {
//     setEditedData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleEarningsChange = (index, subfield, value) => {
//     const newEarnings = [...editedData.earnings];
//     newEarnings[index] = { ...newEarnings[index], [subfield]: value };
//     setEditedData((prev) => ({ ...prev, earnings: newEarnings }));
//   };

//   const handleDeductionsChange = (index, subfield, value) => {
//     const newDeductions = [...editedData.deductions];
//     newDeductions[index] = { ...newDeductions[index], [subfield]: value };
//     setEditedData((prev) => ({ ...prev, deductions: newDeductions }));
//   };

//   const recalculateTotals = (data) => {
//     const gross = (Array.isArray(data.earnings) ? data.earnings : []).reduce(
//       (sum, e) => sum + Number(e.amount || 0),
//       0
//     );
//     const totalDeductions = (Array.isArray(data.deductions) ? data.deductions : []).reduce(
//       (sum, d) => sum + Number(d.amount || 0),
//       0
//     );
//     const net = gross - totalDeductions;
//     return { gross, totalDeductions, net };
//   };

//   const handleSave = () => {
//     const { gross, totalDeductions, net } = recalculateTotals(editedData);
//     const finalData = {
//       ...editedData,
//       gross,
//       totalDeductions,
//       net,
//     };
//     setEditedData(finalData);
//     setIsEditing(false);
//     if (onSave) onSave(finalData);
//   };

//   const handleCancel = () => {
//     setEditedData(originalData);
//     setIsEditing(false);
//   };

//   if (!payroll) return null;

//   const {
//     company,
//     employee,
//     month,
//     earnings,
//     deductions,
//     gross,
//     totalDeductions,
//     net,
//     paymentMethod,
//     paymentDate,
//   } = isEditing ? editedData : payroll;

//   const displayData = isEditing ? editedData : payroll;
//   const { gross: displayGross, totalDeductions: displayTotalDeductions, net: displayNet } =
//     isEditing ? recalculateTotals(displayData) : { gross, totalDeductions, net };

//   const safeEarnings = Array.isArray(earnings) ? earnings : [];
//   const safeDeductions = Array.isArray(deductions) ? deductions : [];

//   return (
//     <div
//       style={{
//         height: "100%",
//         overflowY: "auto",
//         margin: "0 auto",
//         backgroundColor: "white",
//         borderRadius: "0.5rem",
//         padding: "1.5rem ",
//         color: "rgb(30,30,30)",
//         boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
//         fontFamily: "sans-serif",
//         position: "relative",
//       }}
//     >
//       {isEditing && (
//         <div style={{ display: "flex", justifyContent: "end", gap: "0.5rem", padding: "1rem 0" }}>
//           <button
//             onClick={handleSave}
//             style={{
//               padding: "0.5rem 0.51rem",
//               backgroundColor: "#1d293d",
//               color: "white",
//               border: "none",
//               borderRadius: "0.25rem",
//               cursor: "pointer",
//             }}
//           >
//             Save
//           </button>
//           <button
//             onClick={handleCancel}
//             style={{
//               padding: "0.5rem 0.51rem",
//               backgroundColor: "#6a7282",
//               color: "white",
//               border: "none",
//               borderRadius: "0.25rem",
//               cursor: "pointer",
//             }}
//           >
//             Cancel
//           </button>
//         </div>
//       )}

//       {/* Header */}
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
//         <div style={{ display: "flex", gap: "1rem" }}>
//           {company?.logoUrl ? (
//             <img src={company.logoUrl} alt="logo" style={{ width: "64px", height: "64px", objectFit: "contain" }} />
//           ) : (
//             <div style={{ width: "64px", height: "64px", backgroundColor: "rgb(226,232,240)", borderRadius: "0.25rem" }} />
//           )}
//           <div>
//             <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{company?.name || "Company Name"}</h1>
//             <div style={{ fontSize: "0.875rem" }}>{company?.address}</div>
//             <div style={{ fontSize: "0.75rem", color: "rgb(100,116,139)" }}>
//               {company?.phone} • {company?.email}
//             </div>
//           </div>
//         </div>
//         <div style={{ textAlign: "right" }}>
//           <div style={{ fontSize: "0.875rem", color: "rgb(100,116,139)" }}>Payslip for</div>
//           <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>{month}</div>
//           <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>Payslip ID: {`${employee?.id}-${month}`}</div>
//         </div>
//       </div>

//       {/* Employee & Payment Info */}
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
//         <div>
//           <h3 style={{ fontWeight: 600 }}>Employee Details</h3>
//           <table style={{ fontSize: "0.875rem" }}>
//             <tbody>
//               <tr>
//                 <td style={{ paddingRight: "0.5rem" }}>Name:</td>
//                 <td>
//                   {isEditing ? (
//                     <input
//                       type="text"
//                       value={employee?.name}
//                       onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, name: e.target.value } }))}
//                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
//                     />
//                   ) : (
//                     employee?.name
//                   )}
//                 </td>
//               </tr>
//               <tr><td style={{ paddingRight: "0.5rem" }}>Employee ID:</td><td>{employee?.id}</td></tr>
//               <tr>
//                 <td style={{ paddingRight: "0.5rem" }}>Department:</td>
//                 <td>
//                   {isEditing ? (
//                     <input
//                       type="text"
//                       value={employee.department || ""}
//                       onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, department: e.target.value } }))}
//                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
//                     />
//                   ) : (
//                     employee?.department || "-"
//                   )}
//                 </td>
//               </tr>
//               <tr>
//                 <td style={{ paddingRight: "0.5rem" }}>Job Title:</td>
//                 <td>
//                   {isEditing ? (
//                     <input
//                       type="text"
//                       value={employee?.jobTitle || ""}
//                       onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, jobTitle: e.target.value } }))}
//                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
//                     />
//                   ) : (
//                     employee?.jobTitle
//                   )}
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>

//         <div>
//           <h3 style={{ fontWeight: 600 }}>Payment Info</h3>
//           <table style={{ fontSize: "0.875rem" }}>
//             <tbody>
//               <tr>
//                 <td style={{ paddingRight: "0.5rem" }}>Payment Method:</td>
//                 <td>
//                   {isEditing ? (
//                     <input
//                       type="text"
//                       value={paymentMethod}
//                       onChange={(e) => handleChange("paymentMethod", e.target.value)}
//                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
//                     />
//                   ) : (
//                     paymentMethod
//                   )}
//                 </td>
//               </tr>
//               <tr>
//                 <td style={{ paddingRight: "0.5rem" }}>Payment Date:</td>
//                 <td>
//                   {isEditing ? (
//                     <input
//                       type="text"
//                       value={paymentDate}
//                       onChange={(e) => handleChange("paymentDate", e.target.value)}
//                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
//                     />
//                   ) : (
//                     paymentDate
//                   )}
//                 </td>
//               </tr>
//               <tr>
//                 <td style={{ paddingRight: "0.5rem" }}>Bank Account:</td>
//                 <td>
//                   {isEditing ? (
//                     <input
//                       type="text"
//                       value={employee.bankAccount || ""}
//                       onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, bankAccount: e.target.value } }))}
//                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
//                     />
//                   ) : (
//                     employee?.bankAccount || "-"
//                   )}
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Earnings & Deductions */}
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
//   <div style={{ backgroundColor: "rgb(248,250,252)", padding: "0.75rem", borderRadius: "0.25rem" }}>
//     <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Earnings</h4>
//     <table style={{ width: "100%", fontSize: "0.875rem" }}>
//       <tbody>
//         {safeEarnings.map((e, idx) => (
//           <tr key={idx}>
//             <td style={{ width: "75%" }}>
//               {isEditing ? (
//                 <input
//                   type="text"
//                   value={e.label || ""}
//                   onChange={(ev) => handleEarningsChange(idx, "label", ev.target.value)}
//                   style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100%" }}
//                 />
//               ) : (
//                 e.label || "-"
//               )}
//             </td>
//             <td style={{ textAlign: "right" }}>
//               {isEditing ? (
//                 <input
//                   type="number"
//                   value={e.amount || 0}
//                   onChange={(ev) => handleEarningsChange(idx, "amount", Number(ev.target.value) || 0)}
//                   style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100px", textAlign: "right" }}
//                 />
//               ) : (
//                 (Number(e.amount) || 0).toLocaleString()
//               )}
//             </td>
//           </tr>
//         ))}
//         <tr style={{ borderTop: "1px solid #ccc", fontWeight: 600 }}>
//           <td>Total Earnings</td>
//           <td style={{ textAlign: "right" }}>{(Number(displayGross) || 0).toLocaleString()}</td>
//         </tr>
//       </tbody>
//     </table>
//   </div>

//   <div style={{ backgroundColor: "rgb(248,250,252)", padding: "0.75rem", borderRadius: "0.25rem" }}>
//     <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Deductions</h4>
//     <table style={{ width: "100%", fontSize: "0.875rem" }}>
//       <tbody>
//         {safeDeductions.map((d, idx) => (
//           <tr key={idx}>
//             <td style={{ width: "75%" }}>
//               {isEditing ? (
//                 <input
//                   type="text"
//                   value={d.label || ""}
//                   onChange={(ev) => handleDeductionsChange(idx, "label", ev.target.value)}
//                   style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100%" }}
//                 />
//               ) : (
//                 d.label || "-"
//               )}
//             </td>
//             <td style={{ textAlign: "right" }}>
//               {isEditing ? (
//                 <input
//                   type="number"
//                   value={d.amount || 0}
//                   onChange={(ev) => handleDeductionsChange(idx, "amount", Number(ev.target.value) || 0)}
//                   style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100px", textAlign: "right" }}
//                 />
//               ) : (
//                 (Number(d.amount) || 0).toLocaleString()
//               )}
//             </td>
//           </tr>
//         ))}
//         <tr style={{ borderTop: "1px solid #ccc", fontWeight: 600 }}>
//           <td>Total Deductions</td>
//           <td style={{ textAlign: "right" }}>{(Number(displayTotalDeductions) || 0).toLocaleString()}</td>
//         </tr>
//       </tbody>
//     </table>
//   </div>
// </div>


//       {/* Gross & Net */}
//       <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "0.25rem", backgroundColor: "rgb(249,250,251)" }}>
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           <div>
//             <div style={{ fontSize: "0.875rem", color: "rgb(100,116,139)" }}>Gross Salary</div>
//             <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>{displayGross.toLocaleString()}</div>
//           </div>
//           <div>
//             <div style={{ fontSize: "0.875rem", color: "rgb(100,116,139)" }}>Net Pay</div>
//             <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "rgb(22,163,74)" }}>{displayNet.toLocaleString()}</div>
//           </div>
//         </div>
//         <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "rgb(100,116,139)" }}>
//           This is a computer-generated payslip and does not require a signature.
//         </div>
//       </div>
//     </div>
//   );
// });

// export default PayslipTemplate;













































































// // import React, { forwardRef, useState, useImperativeHandle } from "react";

// // const PayslipTemplate = forwardRef(({ payroll, isEditable = false, onSave }, ref) => {
// //   const [isEditing, setIsEditing] = useState(isEditable);
// //   const [editedData, setEditedData] = useState(payroll);
// //   const originalData = payroll;
// //   // console.log(payroll,"from the template")

// //   // Expose methods to parent (e.g., to trigger save/cancel from outside)
// //   useImperativeHandle(ref, () => ({
// //     startEditing: () => setIsEditing(true),
// //     cancelEditing: handleCancel,
// //     save: handleSave,
// //   }));

// //   const handleChange = (field, value) => {
// //     setEditedData((prev) => ({ ...prev, [field]: value }));
// //   };

// //   const handleEarningsChange = (index, subfield, value) => {
// //     const newEarnings = [...editedData.earnings];
// //     newEarnings[index] = { ...newEarnings[index], [subfield]: value };
// //     setEditedData((prev) => ({ ...prev, earnings: newEarnings }));
// //   };

// //   const handleDeductionsChange = (index, subfield, value) => {
// //     const newDeductions = [...editedData.deductions];
// //     newDeductions[index] = { ...newDeductions[index], [subfield]: value };
// //     setEditedData((prev) => ({ ...prev, deductions: newDeductions }));
// //   };

// //   const recalculateTotals = (data) => {
// //     const gross = data.earnings.reduce((sum, e) => sum + Number(e.amount || 0), 0);
// //     const totalDeductions = data.deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
// //     const net = gross - totalDeductions;
// //     return { gross, totalDeductions, net };
// //   };

// //   const handleSave = () => {
// //     const { gross, totalDeductions, net } = recalculateTotals(editedData);
// //     const finalData = {
// //       ...editedData,
// //       gross,
// //       totalDeductions,
// //       net,
// //     };
// //     setEditedData(finalData);
// //     setIsEditing(false);

// //     if (onSave) {
// //       console.log(finalData,"final data");
// //       onSave(finalData);
// //     }
// //   };

// //   const handleCancel = () => {
// //     setEditedData(originalData);
// //     setIsEditing(false);
// //   };

// //   if (!payroll) return null;

// //   const {
// //     company,
// //     employee,
// //     month,
// //     earnings,
// //     deductions,
// //     gross,
// //     totalDeductions,
// //     net,
// //     paymentMethod,
// //     paymentDate,
// //   } = isEditing ? editedData : payroll;

// //   const displayData = isEditing ? editedData : payroll;
// //   const { gross: displayGross, totalDeductions: displayTotalDeductions, net: displayNet } =
// //     isEditing ? recalculateTotals(displayData) : { gross, totalDeductions, net };

// //   return (
// //     <div
// //       style={{
// //         // maxWidth: "768px",
// //         height: "100%",
// //         overflowY: "auto",
// //         margin: "0 auto",
// //         backgroundColor: "white",
// //         borderRadius: "0.5rem",
// //         padding: "1.5rem ",
// //         color: "rgb(30,30,30)",
// //         boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
// //         fontFamily: "sans-serif",
// //         position: "relative",
// //       }}
// //     >
// //       {/* Edit Mode Buttons */}
// //       {isEditing && (
// //         <div style={{ display: "flex",justifyContent:"end", gap: "0.5rem", padding:"1rem 0"}}>
// //           <button
// //             onClick={handleSave}
// //             style={{
// //               padding: "0.5rem 0.51rem",
// //               backgroundColor: "#1d293d",
// //               hoverBackgroundColor: "#0f172b",
// //               color: "white",
// //               border: "none",
// //               borderRadius: "0.25rem",
// //               cursor: "pointer",
// //             }}
// //             className="bg-gray-500"
            
// //           >
// //             Save
// //           </button>
// //           <button
// //             onClick={handleCancel}
// //             style={{
// //               padding: "0.5rem 0.51rem",
// //               backgroundColor: "#6a7282",
// //               color: "white",
// //               border: "none",
// //               borderRadius: "0.25rem",
// //               cursor: "pointer",
// //             }}
// //           >
// //             Cancel
// //           </button>
// //         </div>
// //       )}

// //       {/* Header */}
// //       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
// //         <div style={{ display: "flex", gap: "1rem" }}>
// //           {company?.logoUrl ? (
// //             <img src={company.logoUrl} alt="logo" style={{ width: "64px", height: "64px", objectFit: "contain" }} />
// //           ) : (
// //             <div style={{ width: "64px", height: "64px", backgroundColor: "rgb(226,232,240)", borderRadius: "0.25rem" }} />
// //           )}
// //           <div>
// //             <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{company?.name || "Company Name"}</h1>
// //             <div style={{ fontSize: "0.875rem" }}>{company?.address}</div>
// //             <div style={{ fontSize: "0.75rem", color: "rgb(100,116,139)" }}>
// //               {company?.phone} • {company?.email}
// //             </div>
// //           </div>
// //         </div>
// //         <div style={{ textAlign: "right" }}>
// //           <div style={{ fontSize: "0.875rem", color: "rgb(100,116,139)" }}>Payslip for</div>
// //           <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>{month}</div>
// //           <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>Payslip ID: {`${employee.id}-${month}`}</div>
// //         </div>
// //       </div>

// //       {/* Employee & Payment Info */}
// //       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
// //         <div>
// //           <h3 style={{ fontWeight: 600 }}>Employee Details</h3>
// //           <table style={{ fontSize: "0.875rem" }}>
// //             <tbody>
// //               <tr>
// //                 <td style={{ paddingRight: "0.5rem" }}>Name:</td>
// //                 <td>
// //                   {isEditing ? (
// //                     <input
// //                       type="text"
// //                       value={employee.name}
// //                       onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, name: e.target.value } }))}
// //                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
// //                     />
// //                   ) : (
// //                     employee.name
// //                   )}
// //                 </td>
// //               </tr>
// //               <tr><td style={{ paddingRight: "0.5rem" }}>Employee ID:</td><td>{employee.id}</td></tr>
// //               <tr>
// //                 <td style={{ paddingRight: "0.5rem" }}>Department:</td>
// //                 <td>
// //                   {isEditing ? (
// //                     <input
// //                       type="text"
// //                       value={employee.department || ""}
// //                       onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, department: e.target.value } }))}
// //                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
// //                     />
// //                   ) : (
// //                     employee.department || "-"
// //                   )}
// //                 </td>
// //               </tr>
// //               <tr>
// //                 <td style={{ paddingRight: "0.5rem" }}>Job Title:</td>
// //                 <td>
// //                   {isEditing ? (
// //                     <input
// //                       type="text"
// //                       value={employee.jobTitle || ""}
// //                       onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, jobTitle: e.target.value } }))}
// //                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
// //                     />
// //                   ) : (
// //                     employee.jobTitle
// //                   )}
// //                 </td>
// //               </tr>
// //             </tbody>
// //           </table>
// //         </div>
// //         <div>
// //           <h3 style={{ fontWeight: 600 }}>Payment Info</h3>
// //           <table style={{ fontSize: "0.875rem" }}>
// //             <tbody>
// //               <tr>
// //                 <td style={{ paddingRight: "0.5rem" }}>Payment Method:</td>
// //                 <td>
// //                   {isEditing ? (
// //                     <input
// //                       type="text"
// //                       value={paymentMethod}
// //                       onChange={(e) => handleChange("paymentMethod", e.target.value)}
// //                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
// //                     />
// //                   ) : (
// //                     paymentMethod
// //                   )}
// //                 </td>
// //               </tr>
// //               <tr>
// //                 <td style={{ paddingRight: "0.5rem" }}>Payment Date:</td>
// //                 <td>
// //                   {isEditing ? (
// //                     <input
// //                       type="text"
// //                       value={paymentDate}
// //                       onChange={(e) => handleChange("paymentDate", e.target.value)}
// //                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
// //                     />
// //                   ) : (
// //                     paymentDate
// //                   )}
// //                 </td>
// //               </tr>
// //               <tr>
// //                 <td style={{ paddingRight: "0.5rem" }}>Bank Account:</td>
// //                 <td>
// //                   {isEditing ? (
// //                     <input
// //                       type="text"
// //                       value={employee.bankAccount || ""}
// //                       onChange={(e) => setEditedData((prev) => ({ ...prev, employee: { ...prev.employee, bankAccount: e.target.value } }))}
// //                       style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem" }}
// //                     />
// //                   ) : (
// //                     employee.bankAccount || "-"
// //                   )}
// //                 </td>
// //               </tr>
// //             </tbody>
// //           </table>
// //         </div>
// //       </div>

// //       {/* Earnings & Deductions */}
// //       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
// //         <div style={{ backgroundColor: "rgb(248,250,252)", padding: "0.75rem", borderRadius: "0.25rem" }}>
// //           <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Earnings</h4>
// //           <table style={{ width: "100%", fontSize: "0.875rem" }}>
// //             <tbody>
// //               {earnings.map((e, idx) => (
// //                 <tr key={idx}>
// //                   <td style={{ width: "75%" }}>
// //                     {isEditing ? (
// //                       <input
// //                         type="text"
// //                         value={e.label}
// //                         onChange={(ev) => handleEarningsChange(idx, "label", ev.target.value)}
// //                         style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100%" }}
// //                       />
// //                     ) : (
// //                       e.label
// //                     )}
// //                   </td>
// //                   <td style={{ textAlign: "right" }}>
// //                     {isEditing ? (
// //                       <input
// //                         type="number"
// //                         value={e.amount}
// //                         onChange={(ev) => handleEarningsChange(idx, "amount", Number(ev.target.value) || 0)}
// //                         style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100px", textAlign: "right" }}
// //                       />
// //                     ) : (
// //                       e.amount.toLocaleString()
// //                     )}
// //                   </td>
// //                 </tr>
// //               ))}
// //               <tr style={{ borderTop: "1px solid #ccc", fontWeight: 600 }}>
// //                 <td>Total Earnings</td>
// //                 <td style={{ textAlign: "right" }}>{displayGross.toLocaleString()}</td>
// //               </tr>
// //             </tbody>
// //           </table>
// //         </div>

// //         <div style={{ backgroundColor: "rgb(248,250,252)", padding: "0.75rem", borderRadius: "0.25rem" }}>
// //           <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Deductions</h4>
// //           <table style={{ width: "100%", fontSize: "0.875rem" }}>
// //             <tbody>
// //               {deductions.map((d, idx) => (
// //                 <tr key={idx}>
// //                   <td style={{ width: "75%" }}>
// //                     {isEditing ? (
// //                       <input
// //                         type="text"
// //                         value={d.label}
// //                         onChange={(ev) => handleDeductionsChange(idx, "label", ev.target.value)}
// //                         style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100%" }}
// //                       />
// //                     ) : (
// //                       d.label
// //                     )}
// //                   </td>
// //                   <td style={{ textAlign: "right" }}>
// //                     {isEditing ? (
// //                       <input
// //                         type="number"
// //                         value={d.amount}
// //                         onChange={(ev) => handleDeductionsChange(idx, "amount", Number(ev.target.value) || 0)}
// //                         style={{ border: "1px solid #ccc", borderRadius: "0.25rem", padding: "0.25rem", width: "100px", textAlign: "right" }}
// //                       />
// //                     ) : (
// //                       d.amount.toLocaleString()
// //                     )}
// //                   </td>
// //                 </tr>
// //               ))}
// //               <tr style={{ borderTop: "1px solid #ccc", fontWeight: 600 }}>
// //                 <td>Total Deductions</td>
// //                 <td style={{ textAlign: "right" }}>{displayTotalDeductions.toLocaleString()}</td>
// //               </tr>
// //             </tbody>
// //           </table>
// //         </div>
// //       </div>

// //       {/* Gross & Net */}
// //       <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "0.25rem", backgroundColor: "rgb(249,250,251)" }}>
// //         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //           <div>
// //             <div style={{ fontSize: "0.875rem", color: "rgb(100,116,139)" }}>Gross Salary</div>
// //             <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>{displayGross.toLocaleString()}</div>
// //           </div>
// //           <div>
// //             <div style={{ fontSize: "0.875rem", color: "rgb(100,116,139)" }}>Net Pay</div>
// //             <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "rgb(22,163,74)" }}>{displayNet.toLocaleString()}</div>
// //           </div>
// //         </div>
// //         <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "rgb(100,116,139)" }}>
// //           This is a computer-generated payslip and does not require a signature.
// //         </div>
// //       </div>
// //     </div>
// //   );
// // });

// // export default PayslipTemplate;
