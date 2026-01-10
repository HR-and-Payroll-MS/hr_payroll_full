// src/components/PayslipViewer.jsx
import React, { useEffect, useState } from "react";

export default function PayslipViewer({ keyId }) {
  const [pdfUrl, setPdfUrl] = useState(null);

  // STATIC DUMMY PDF (replace later)
  const dummyPdf = "/dummy_payslip.pdf";

  useEffect(() => {
    // For now: pretend every payslip = same PDF
    setPdfUrl(dummyPdf);

    // Later: replace with IndexedDB get
    // const blob = await idbGet(keyId)
    // setPdfUrl(URL.createObjectURL(blob));
  }, [keyId]);

  if (!pdfUrl) return <div>Loading payslip...</div>;

  return (
    <iframe
      src={pdfUrl}
      title="Payslip Viewer"
      className="w-full h-[800px] border rounded"
    />
  );
}
