// import React, { useRef } from "react";

// const PayslipTemplate2 = ({ payroll }) => {
//   const printRef = useRef();

//   if (!payroll) return null;

//   const source = payroll.details || payroll;
//   const employee = payroll.details ? {
//     id: payroll.id,
//     name: payroll.name,
//     department: payroll.department,
//     jobTitle: payroll.jobTitle,
//     bankAccount: payroll.bankAccount
//   } : payroll.employee;

//   const handlePrint = () => {
//     window.print();
//   };

//   return (
//     <>
//       {/* Print Styles Injection */}
//       <style>
//         {`
//           @media print {
//             .no-print { display: none !important; }
//             body { background: white !important; }
//             .payslip-container { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; }
//           }
//         `}
//       </style>

//       {/* Action Bar (Employee Specific) */}
//       <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '10px' }}>
//         <button 
//           onClick={handlePrint}
//           style={{ padding: "8px 16px", backgroundColor: "#1e293b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
//         >
//           Download as PDF / Print
//         </button>
//       </div>

//       <div 
//         className="payslip-container"
//         style={{ height: "auto", margin: "0 auto", backgroundColor: "white", borderRadius: "0.5rem", padding: "2.5rem", color: "rgb(30,30,30)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontFamily: "sans-serif", border: "1px solid #e2e8f0" }}
//       >
        
//         {/* 1. HEADER SECTION */}
//         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
//           <div style={{ display: "flex", gap: "1.25rem" }}>
//             {source.company?.logoUrl ? (
//               <img src={source.company.logoUrl} alt="Company Logo" style={{ width: "80px", height: "80px", objectFit: "contain" }} />
//             ) : (
//               <div style={{ width: "80px", height: "80px", backgroundColor: "#f1f5f9", borderRadius: "8px", display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8' }}>LOGO</div>
//             )}
//             <div>
//               <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>{source.company?.name}</h1>
//               <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px", maxWidth: "250px" }}>{source.company?.address}</div>
//               <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>{source.company?.email} • {source.company?.phone}</div>
//             </div>
//           </div>
//           <div style={{ textAlign: "right" }}>
//             <h2 style={{ fontSize: "1.125rem", margin: 0, color: "#1e293b" }}>PAY ADVICE</h2>
//             <div style={{ fontSize: "1rem", fontWeight: 700, color: "#4f46e5", margin: "4px 0" }}>{source.month}</div>
//             <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Ref: PAY-{employee.id}-{source.month.replace(' ', '')}</div>
//           </div>
//         </div>

//         {/* 2. EMPLOYEE & PAYMENT GRID */}
//         <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem", marginBottom: "2rem", padding: "1.5rem", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
//           <div>
//             <h3 style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Employee Information</h3>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.85rem" }}>
//               <div style={{ color: "#64748b" }}>Name: <span style={{ color: "#1e293b", fontWeight: 600 }}>{employee.name}</span></div>
//               <div style={{ color: "#64748b" }}>Staff ID: <span style={{ color: "#1e293b", fontWeight: 600 }}>{employee.id}</span></div>
//               <div style={{ color: "#64748b" }}>Department: <span style={{ color: "#1e293b" }}>{employee.department}</span></div>
//               <div style={{ color: "#64748b" }}>Designation: <span style={{ color: "#1e293b" }}>{employee.jobTitle}</span></div>
//             </div>
//           </div>
//           <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "1.5rem" }}>
//             <h3 style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Payment Details</h3>
//             <div style={{ fontSize: "0.85rem", lineHeight: "1.6" }}>
//               <div style={{ color: "#64748b" }}>Bank: <span style={{ color: "#1e293b" }}>{employee.bankAccount}</span></div>
//               <div style={{ color: "#64748b" }}>Date: <span style={{ color: "#1e293b" }}>{source.paymentDate}</span></div>
//               <div style={{ color: "#64748b" }}>Method: <span style={{ color: "#1e293b" }}>{source.paymentMethod}</span></div>
//             </div>
//           </div>
//         </div>

//         {/* 3. EARNINGS & DEDUCTIONS TABLE */}
//         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
//           {/* Earnings */}
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead>
//               <tr style={{ textAlign: "left", fontSize: "0.75rem", color: "#64748b", borderBottom: "2px solid #f1f5f9" }}>
//                 <th style={{ paddingBottom: "10px" }}>EARNINGS</th>
//                 <th style={{ paddingBottom: "10px", textAlign: "right" }}>AMOUNT</th>
//               </tr>
//             </thead>
//             <tbody style={{ fontSize: "0.875rem" }}>
//               {source.earnings.map((e, i) => (
//                 <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
//                   <td style={{ padding: "10px 0" }}>{e.label}</td>
//                   <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 600 }}>{e.amount.toLocaleString()}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {/* Deductions */}
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead>
//               <tr style={{ textAlign: "left", fontSize: "0.75rem", color: "#64748b", borderBottom: "2px solid #f1f5f9" }}>
//                 <th style={{ paddingBottom: "10px" }}>DEDUCTIONS</th>
//                 <th style={{ paddingBottom: "10px", textAlign: "right" }}>AMOUNT</th>
//               </tr>
//             </thead>
//             <tbody style={{ fontSize: "0.875rem" }}>
//               {source.deductions.map((d, i) => (
//                 <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
//                   <td style={{ padding: "10px 0" }}>{d.label}</td>
//                   <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 600, color: "#ef4444" }}>{d.amount.toLocaleString()}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* 4. YEAR-TO-DATE (YTD) SUMMARY (CRITICAL FOR EMPLOYEES) */}
//         <div style={{ display: "flex", gap: "20px", padding: "15px", backgroundColor: "#f1f5f9", borderRadius: "8px", marginBottom: "2rem", border: "1px dashed #cbd5e1" }}>
//            <div style={{ fontSize: "0.75rem" }}>
//               <span style={{ color: "#64748b" }}>YTD GROSS: </span>
//               <span style={{ fontWeight: 700 }}>{(source.gross * 12).toLocaleString()}</span>
//            </div>
//            <div style={{ fontSize: "0.75rem" }}>
//               <span style={{ color: "#64748b" }}>YTD TAX: </span>
//               <span style={{ fontWeight: 700 }}>{(source.totalDeductions * 12).toLocaleString()}</span>
//            </div>
//            <div style={{ fontSize: "0.75rem" }}>
//               <span style={{ color: "#64748b" }}>ATTENDANCE: </span>
//               <span style={{ fontWeight: 700 }}>{payroll.attendedDays} Days</span>
//            </div>
//         </div>

//         {/* 5. NET PAY FOOTER */}
//         <div style={{ backgroundColor: "#1e293b", color: "white", padding: "1.5rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           <div>
//             <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>Total Gross</div>
//             <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{source.gross.toLocaleString()}</div>
//           </div>
//           <div style={{ textAlign: "right" }}>
//             <div style={{ fontSize: "0.85rem", color: "#4ade80", fontWeight: 700 }}>NET PAYABLE AMOUNT</div>
//             <div style={{ fontSize: "2rem", fontWeight: 800, color: "#4ade80" }}>{source.net.toLocaleString()}</div>
//           </div>
//         </div>

//         {/* 6. SIGNATURE & VERIFICATION SECTION */}
//         <div style={{ marginTop: "3rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
//           <div style={{ textAlign: "center" }}>
//             <div style={{ marginBottom: "5px" }}>
//               {/* This can be a real image of a signature */}
//               <span style={{ fontFamily: "cursive", fontSize: "1.2rem", color: "#4f46e5" }}>Finance Director</span>
//             </div>
//             <div style={{ width: "200px", borderTop: "1px solid #cbd5e1", paddingTop: "5px", fontSize: "0.75rem", color: "#64748b" }}>
//               Authorized Signatory
//             </div>
//           </div>
          
//           <div style={{ textAlign: "right", opacity: 0.6 }}>
//              <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginBottom: "5px" }}>Digitally Verified</div>
//              <div style={{ padding: "10px", border: "2px solid #4ade80", borderRadius: "50%", color: "#4ade80", display: "inline-block", fontSize: "0.6rem", fontWeight: 900, transform: "rotate(-15deg)" }}>
//                 PAID
//              </div>
//           </div>
//         </div>

//         <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9", textAlign: "center", fontSize: "0.7rem", color: "#94a3b8" }}>
//           This is a computer-generated payslip and does not require a physical signature. 
//           For queries, contact <strong>{source.company?.email || 'HR'}</strong>.
//         </div>
//       </div>
//     </>
//   );
// };

// export default PayslipTemplate2;




import React, { useRef } from "react";
import html2pdf from "html2pdf.js";
const mockData= { 
    id: 'EMP001', 
    department: 'Finance', 
    jobTitle: "Senior Accountant", 
    bankAccount: "GTB ****3248", 
    name: "Sarah Jenkins", 
    baseSalary: 6000, 
    bonus: 500,
    attendedDays: 22, 
    lopDays: 0,
    taxCode: 'Standard', 
    taxVersion: '2025 v1.0',
    taxAmount: 1200, 
    netPay: 5300,
    taxDisplay: "Standard (2025 v1.0)",
    // FULL PAYLOAD FOR TEMPLATE
    details: {
      company: { 
        name: "TechCorp Solutions Ltd", 
        address: "123 Business Avenue, Lagos, Nigeria", 
        phone: "+234 812 345 6789", 
        email: "payroll@techcorp.com", 
        logoUrl: "https://via.placeholder.com/64" 
      },
      month: "December 2025",
      paymentDate: "2025-12-30",
      paymentMethod: "Bank Transfer",
      earnings: [
        { label: "Basic Salary", amount: 6000 },
        { label: "Performance Bonus", amount: 500 },
        { label: "Housing Allowance", amount: 1000 }
      ],
      deductions: [
        { label: "Income Tax (PAYE)", amount: 1200 },
        { label: "Pension Contribution", amount: 500 },
        { label: "Health Insurance", amount: 200 },
        { label: "Lateness Deduction", amount: 0 }
      ],
      gross: 7500,
      totalDeductions: 1900,
      net: 5600
    }
  }
const EmployeePayslipTemplate = ({ payroll }) => {
  const payslipRef = useRef();
payroll=mockData
  if (!payroll) return null;

  const source = payroll.details || payroll;
  const employee = payroll.details ? {
    id: payroll.id,
    name: payroll.name,
    department: payroll.department,
    jobTitle: payroll.jobTitle,
    bankAccount: payroll.bankAccount
  } : payroll.employee;

  // --- PDF DOWNLOAD LOGIC ---
  const handleDownloadPDF = () => {
    const element = payslipRef.current;
    const opt = {
      margin:       0.5,
      filename:     `Payslip_${employee.name}_${source.month}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true }, // useCORS is key for the Logo!
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // New Promise-based usage:
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="relative" style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      
      {/* Download Button */}
      <div  className="sticky top-0" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
       <button 
  onClick={handleDownloadPDF}
  className="bg-[#052f4a] dark:bg-slate-300 dark:text-slate-900 text-white px-[20px] py-[10px] rounded-[6px] text-[0.9rem] font-bold cursor-pointer border-none"
>
          📥 Download Payslip (PDF)
        </button>
      </div>

      {/* The Actual Payslip Area */}
      <div 
        ref={payslipRef}
        style={{ 
          backgroundColor: "white", 
          borderRadius: "0.5rem", 
          padding: "2.5rem", 
          color: "rgb(30,30,30)", 
          fontFamily: "sans-serif", 
          border: "1px solid #e2e8f0" 
        }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            {source.company?.logoUrl ? (
              <img 
                src={source.company.logoUrl} 
                alt="Logo" 
                style={{ width: "80px", height: "80px", objectFit: "contain" }} 
              />
            ) : (
              <div style={{ width: "80px", height: "80px", backgroundColor: "#f1f5f9", borderRadius: "8px" }} />
            )}
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>{source.company?.name}</h1>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>{source.company?.address}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: "1.125rem", margin: 0, color: "#1e293b" }}>PAY ADVICE</h2>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#4f46e5" }}>{source.month}</div>
          </div>
        </div>

        {/* INFO GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem", marginBottom: "2rem", padding: "1.5rem", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
          <div>
            <h3 style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", marginBottom: "10px" }}>Employee</h3>
            <div style={{ fontSize: "0.85rem" }}>
              <strong>{employee.name}</strong><br/>
              ID: {employee.id}<br/>
              {employee.department} • {employee.jobTitle}
            </div>
          </div>
          <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "1.5rem" }}>
            <h3 style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", marginBottom: "10px" }}>Payment</h3>
            <div style={{ fontSize: "0.85rem" }}>
              Bank: {employee.bankAccount}<br/>
              Date: {source.paymentDate}<br/>
              Method: {source.paymentMethod}
            </div>
          </div>
        </div>

        {/* TABLES */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: "0.75rem", borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ paddingBottom: "10px" }}>EARNINGS</th>
                <th style={{ paddingBottom: "10px", textAlign: "right" }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {source.earnings.map((e, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f8fafc", fontSize: "0.85rem" }}>
                  <td style={{ padding: "10px 0" }}>{e.label}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{e.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: "0.75rem", borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ paddingBottom: "10px" }}>DEDUCTIONS</th>
                <th style={{ paddingBottom: "10px", textAlign: "right" }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {source.deductions.map((d, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f8fafc", fontSize: "0.85rem" }}>
                  <td style={{ padding: "10px 0" }}>{d.label}</td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: "#ef4444" }}>{d.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER SUMMARY */}
        <div style={{ backgroundColor: "#1e293b", color: "white", padding: "1.5rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>GROSS EARNINGS</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{source.gross.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.85rem", color: "#4ade80", fontWeight: 700 }}>NET PAYABLE</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#4ade80" }}>{source.net.toLocaleString()}</div>
          </div>
        </div>

        {/* SIGNATURE AREA */}
        <div style={{ marginTop: "3rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: "cursive", fontSize: "1.2rem", color: "#4f46e5", marginBottom: "5px" }}>Finance Team</div>
            <div style={{ width: "200px", borderTop: "1px solid #cbd5e1", fontSize: "0.75rem", color: "#64748b", paddingTop: "5px" }}>Authorized Signatory</div>
          </div>
          <div style={{ padding: "10px", border: "2px solid #4ade80", borderRadius: "8px", color: "#4ade80", fontWeight: 900, fontSize: "0.8rem", transform: "rotate(-10deg)" }}>
            PAID IN FULL
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePayslipTemplate;