import React, { useState } from "react";
import axios from "axios";
import PDFViewer from "../Components/PDFViewer";

export default function PDFManager() {
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setPdfFile(file);
  };
  const handleUpload = async () => {
    if (!pdfFile) {
      alert("Please select a PDF file first!");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", pdfFile);

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedUrl(res.data.url);
      alert("✅ Upload successful!");
    } catch (err) {
      console.error(err);
      alert("❌ Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4 items-center">
      <h1 className="text-2xl font-bold mb-4">Dynamic PDF Uploader & Viewer</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} className="border rounded p-2 w-72 text-gray-700 dark:text-gray-300"/>
      <div className="flex gap-3">
        <button onClick={handleUpload} disabled={!pdfFile || loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Uploading..." : "Upload PDF"}
        </button>

      </div>
      {pdfFile && !uploadedUrl && (
        <div className="mt-4 w-full max-w-3xl">
          <h2 className="font-semibold mb-2 text-gray-700">
            Local Preview (Before Upload)
          </h2>
          <PDFViewer file={pdfFile} onClose={() => setPdfFile(null)} />
        </div>
      )}

      
    </div>
  );
}























// export default function PDFManager() {
//   const [pdfFile, setPdfFile] = useState(null);
//   const [uploadedUrl, setUploadedUrl] = useState(null);
//   const [showViewer, setShowViewer] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) setPdfFile(file);
//   };

//   const handleUpload = async () => {
//     if (!pdfFile) {
//       alert("Please select a PDF file first!");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("pdf", pdfFile);

//     try {
//       setLoading(true);
//       const res = await axios.post("http://localhost:5000/upload", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       // Suppose your backend returns the hosted file URL like:
//       // { url: "http://localhost:5000/uploads/yourfile.pdf" }
//       setUploadedUrl(res.data.url);
//       alert("Upload successful!");
//     } catch (err) {
//       console.error(err);
//       alert("Upload failed.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 flex flex-col gap-4 items-center">
//       <h1 className="text-2xl font-bold mb-4">Dynamic PDF Uploader & Viewer</h1>

//       <input
//         type="file"
//         accept="application/pdf"
//         onChange={handleFileChange}
//         className="border rounded p-2 w-72"
//       />

//       <div className="flex gap-3">
//         <button
//           onClick={handleUpload}
//           disabled={!pdfFile || loading}
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
//         >
//           {loading ? "Uploading..." : "Upload PDF"}
//         </button>

//         {uploadedUrl && (
//           <button
//             onClick={() => setShowViewer((p) => !p)}
//             className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
//           >
//             {showViewer ? "Hide PDF" : "Show PDF"}
//           </button>
//         )}
//       </div>

//       {/* Show local preview before upload */}
//       {pdfFile && !uploadedUrl && (
//         <div className="mt-4 w-full max-w-3xl">
//           <h2 className="font-semibold mb-2 text-gray-700">
//             Local Preview (Before Upload)
//           </h2>
//           <PDFViewer file={pdfFile} />
//         </div>
//       )}

//       {/* Show uploaded PDF from backend */}
//       {showViewer && uploadedUrl && (
//         <div className="mt-4 w-full max-w-3xl">
//           <h2 className="font-semibold mb-2 text-gray-700">
//             Uploaded PDF (From Server)
//           </h2>
//           <PDFViewer url={uploadedUrl} />
//         </div>
//       )}
//     </div>
//   );
// }






















// import React, { useState } from "react";
// import PDFViewer from "../Components/PDFViewer";

// export default function CVReader() {
//   const [pdfBuffer, setPdfBuffer] = useState(null);

//   const handleFileChange = async (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const buffer = await file.arrayBuffer();
//       setPdfBuffer(buffer);
//     }
//   };

//   return (
//     <div className="w-full h-full bg-amber-900">
//       <input
//         type="file"
//         accept="application/pdf"
//         onChange={handleFileChange}
//         className="block w-full text-sm text-gray-700 dark:text-gray-300 
//                    file:mr-4 file:py-2 file:px-4 
//                    file:rounded-md file:border-0 
//                    file:text-sm file:font-semibold 
//                    file:bg-blue-50 file:text-blue-700 
//                    hover:file:bg-blue-100
//                    dark:file:bg-gray-800 dark:file:text-gray-100"
//       />
//       <div className="w-full h-full">
//         {pdfBuffer && <PDFViewer pdfData={pdfBuffer} />}
//       </div>
//     </div>
//   );
// }
