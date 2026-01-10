

import React, { useState } from 'react'
import PDFViewer from '../../Components/PDFViewer';

function Pdf() {
  
  const [pdfBuffer, setPdfBuffer] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      setPdfBuffer(arrayBuffer);
    }
  };

  return (
    <div style={{ width: "600px", height: "800px", border: "1px solid #ccc" }}>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {pdfBuffer && <PDFViewer pdfData={pdfBuffer} containerId="pdf-container" />}
    </div>
  );
}

export default Pdf