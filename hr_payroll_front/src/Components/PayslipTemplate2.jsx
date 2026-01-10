import React, { useState, useEffect } from "react";

/**
 * PayslipTemplate2 - Editable & Policy Integrated Version
 * @param {Object} payroll - The data object from backend
 * @param {Boolean} editable - Toggle to turn on input fields
 * @param {Function} onSave - Callback to send updated data back to backend
 */
const PayslipTemplate2 = ({ payroll, editable = false, onSave }) => {
  const [formData, setFormData] = useState(null);

  // Sync internal state when payroll prop changes
  useEffect(() => {
    if (payroll) {
      setFormData(JSON.parse(JSON.stringify(payroll))); // Deep clone to avoid mutation
    }
  }, [payroll]);

  if (!formData) return null;

  // Data Extraction logic (Flattening nested backend structure)
  const source = formData.details || formData;
  const employee = formData.details ? {
    id: formData.id,
    name: formData.name,
    department: formData.department,
    jobTitle: formData.jobTitle,
    bankAccount: formData.bankAccount
  } : formData.employee;

  const safeEarnings = Array.isArray(source.earnings) ? source.earnings : [];
  const safeDeductions = Array.isArray(source.deductions) ? source.deductions : [];

  // Handle live editing of amounts
  const handleUpdateAmount = (type, index, value) => {
    const updated = { ...formData };
    const targetSource = updated.details || updated;
    const numValue = parseFloat(value) || 0;

    if (type === 'earnings') targetSource.earnings[index].amount = numValue;
    if (type === 'deductions') targetSource.deductions[index].amount = numValue;

    // Recalculate Totals for the UI
    targetSource.gross = targetSource.earnings.reduce((acc, curr) => acc + curr.amount, 0);
    targetSource.totalDeductions = targetSource.deductions.reduce((acc, curr) => acc + curr.amount, 0);
    targetSource.net = targetSource.gross - targetSource.totalDeductions;

    setFormData(updated);
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", margin: "0 auto", backgroundColor: "white", borderRadius: "0.5rem", padding: "1.5rem", color: "rgb(30,30,30)", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", fontFamily: "sans-serif", position: "relative" }}>
      
      {/* 1. Header (Identical to your original) */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          {source.company?.logoUrl ? (
            <img src={source.company.logoUrl} alt="logo" style={{ width: "64px", height: "64px", objectFit: "contain" }} />
          ) : (
            <div style={{ width: "64px", height: "64px", backgroundColor: "rgb(226,232,240)", borderRadius: "0.25rem" }} />
          )}
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>{source.company?.name || "Company Name"}</h1>
            <div style={{ fontSize: "0.875rem", marginTop: "4px" }}>{source.company?.address}</div>
            <div style={{ fontSize: "0.75rem", color: "rgb(100,116,139)", marginTop: "2px" }}>
              {source.company?.phone} • {source.company?.email}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.875rem", color: "rgb(100,116,139)" }}>Payslip for</div>
          <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>{source.month}</div>
          <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
            ID: {employee?.id ? `${employee.id}-${source.month}` : "-"}
          </div>
        </div>
      </div>

      <hr style={{ border: "0", borderTop: "1px solid #f1f5f9", marginBottom: "1.5rem" }} />

      {/* 2. COMPLIANCE & ATTENDANCE SUMMARY (NEW) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", marginBottom: "1.5rem" }}>
        <div>
          <h4 style={{ margin: "0 0 4px 0", fontSize: "0.7rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>Tax Calculation Basis</h4>
          <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            Regime: <span style={{ color: "#4f46e5" }}>{formData.taxCode || "Not Configured"}</span> 
            <span style={{ marginLeft: "8px", fontSize: "0.75rem", color: "#94a3b8", fontWeight: 400 }}>v.{formData.taxVersion || "1.0"}</span>
          </div>
        </div>
        <div style={{ borderLeft: "2px solid #e2e8f0", paddingLeft: "15px" }}>
          <h4 style={{ margin: "0 0 4px 0", fontSize: "0.7rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>Attendance Insight</h4>
          <div style={{ fontSize: "0.85rem" }}>
            Days Attended: <b>{formData.attendedDays || 0}</b> | LOP Days: <b style={{ color: "#ef4444" }}>{formData.lopDays || 0}</b>
          </div>
        </div>
      </div>

      {/* 3. Employee & Payment Info (Identical to your original) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "1.5rem" }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: "0.9rem", color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Employee Details</h3>
          <table style={{ fontSize: "0.875rem", width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr><td style={{ padding: "4px 0", color: "#64748b" }}>Name:</td><td style={{ fontWeight: 500 }}>{employee?.name}</td></tr>
              <tr><td style={{ padding: "4px 0", color: "#64748b" }}>ID:</td><td>{employee?.id}</td></tr>
              <tr><td style={{ padding: "4px 0", color: "#64748b" }}>Department:</td><td>{employee?.department || "-"}</td></tr>
              <tr><td style={{ padding: "4px 0", color: "#64748b" }}>Job Title:</td><td>{employee?.jobTitle || "-"}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: "0.9rem", color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Payment Info</h3>
          <table style={{ fontSize: "0.875rem", width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr><td style={{ padding: "4px 0", color: "#64748b" }}>Method:</td><td>{source.paymentMethod || "-"}</td></tr>
              <tr><td style={{ padding: "4px 0", color: "#64748b" }}>Date:</td><td>{source.paymentDate || "-"}</td></tr>
              <tr><td style={{ padding: "4px 0", color: "#64748b" }}>Bank Acc:</td><td>{employee?.bankAccount || "-"}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Earnings & Deductions Tables (Updated with Editable inputs) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Earnings */}
        <div style={{ backgroundColor: "rgb(248,250,252)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #f1f5f9" }}>
          <h4 style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.9rem" }}>Earnings</h4>
          <table style={{ width: "100%", fontSize: "0.875rem" }}>
            <tbody>
              {safeEarnings.map((e, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "4px 0" }}>{e.label}</td>
                  <td style={{ textAlign: "right", fontWeight: 500 }}>
                    {editable ? (
                      <input 
                        type="number" 
                        value={e.amount} 
                        onChange={(event) => handleUpdateAmount('earnings', idx, event.target.value)}
                        style={{ width: "80px", textAlign: "right", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "2px 4px" }}
                      />
                    ) : (
                      (e.amount || 0).toLocaleString()
                    )}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "1px solid #e2e8f0", fontWeight: 700 }}>
                <td style={{ padding: "8px 0 0 0" }}>Total Earnings</td>
                <td style={{ textAlign: "right", padding: "8px 0 0 0" }}>{(source.gross || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Deductions */}
        <div style={{ backgroundColor: "rgb(248,250,252)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #f1f5f9" }}>
          <h4 style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.9rem" }}>Deductions & Policies</h4>
          <table style={{ width: "100%", fontSize: "0.875rem" }}>
            <tbody>
              {safeDeductions.map((d, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "4px 0" }}>{d.label}</td>
                  <td style={{ textAlign: "right", fontWeight: 500 }}>
                    {editable ? (
                      <input 
                        type="number" 
                        value={d.amount} 
                        onChange={(event) => handleUpdateAmount('deductions', idx, event.target.value)}
                        style={{ width: "80px", textAlign: "right", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "2px 4px", color: "#ef4444" }}
                      />
                    ) : (
                      (d.amount || 0).toLocaleString()
                    )}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "1px solid #e2e8f0", fontWeight: 700 }}>
                <td style={{ padding: "8px 0 0 0" }}>Total Deductions</td>
                <td style={{ textAlign: "right", padding: "8px 0 0 0" }}>{(source.totalDeductions || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. POLICY REMARKS (NEW) */}
      <div style={{ marginBottom: "1.5rem", padding: "10px", borderLeft: "4px solid #4f46e5", backgroundColor: "#f5f3ff", fontSize: "0.75rem", color: "#5b21b6" }}>
        <strong>Policy Note:</strong> Calculations include statutory tax compliance and internal conduct policies. Any adjustments to Attendance or Conduct deductions must be approved by the Department Head.
      </div>

      {/* 6. Summary Footer (Identical to original) */}
      <div style={{ padding: "1.25rem", borderRadius: "0.5rem", backgroundColor: "#1e293b", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#cbd5e1", textTransform: "uppercase" }}>Gross Salary</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{(source.gross || 0).toLocaleString()}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.75rem", color: "#cbd5e1", textTransform: "uppercase" }}>Net Pay</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#4ade80" }}>
              {(source.net || 0).toLocaleString()}
            </div>
          </div>
        </div>
        <div style={{ marginTop: "1rem", fontSize: "0.7rem", color: "#94a3b8", textAlign: "center", borderTop: "1px solid #334155", paddingTop: "0.75rem" }}>
          This is a computer-generated document. No signature required.
        </div>
      </div>

      {/* 7. Action Controls (Editable Only) */}
      {editable && (
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button 
              onClick={() => setFormData(JSON.parse(JSON.stringify(payroll)))}
              style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #d1d5db", cursor: "pointer", fontSize: "0.8rem" }}
            >
              Reset
            </button>
            <button 
              onClick={() => onSave(formData)}
              style={{ padding: "8px 16px", borderRadius: "6px", border: "none", backgroundColor: "#4f46e5", color: "white", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
            >
              Update Payroll
            </button>
        </div>
      )}
    </div>
  );
};

export default PayslipTemplate2;