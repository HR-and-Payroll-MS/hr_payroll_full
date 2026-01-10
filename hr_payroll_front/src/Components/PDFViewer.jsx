// import React, { useEffect, useState } from "react";
// export default function PDFViewer({ url, onClose }) {
//   if (!url) {
//     return (
//       <div className="w-full h-full flex items-center justify-center">
//         <p className="text-gray-500">No PDF to display.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="relative w-full h-full border rounded-lg overflow-auto bg-white shadow-md">
//       {/* Close button */}
//       {onClose && (
//         <button
//           onClick={onClose}
//           className="absolute top-2 right-2 z-10 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
//         >
//           ✕
//         </button>
//       )}

//       <iframe
//         src={url}
//         title="PDF Viewer"
//         className="w-full h-full border-none"
//         style={{ minHeight: "100%", height: "100%" }}
//       />
//     </div>
//   );
// }












































import React, { useEffect, useState } from "react";

export default function PDFViewer({ file, url, onClose }) {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    let localUrl = null;

    if (file instanceof File || file instanceof Blob) {
      localUrl = URL.createObjectURL(file);
      setPdfUrl(localUrl);
    } else if (typeof url === "string") {
      setPdfUrl(url);
    } else {
      setPdfUrl(null);
    }

    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
      setPdfUrl(null);
    };
  }, [file, url]);

  if (!pdfUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">No PDF to display.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg border rounded-lg overflow-auto bg-white shadow-md">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
        >
          ✕
        </button>
      )}

      <iframe
        src={pdfUrl}
        title="PDF Viewer"
        className="w-full h-full border-none"
        style={{ minHeight: "100%", height: "100%" }}
      />
    </div>
  );
}







































// import React, { useEffect, useMemo, useState } from "react";
// export default function FileViewer({ file, url }) {
//   const [blobUrl, setBlobUrl] = useState(null);

//   // create blob URL for File if provided
//   useEffect(() => {
//     if (file) {
//       const u = URL.createObjectURL(file);
//       setBlobUrl(u);
//       return () => {
//         URL.revokeObjectURL(u);
//         setBlobUrl(null);
//       };
//     }
//     // if file removed, clear
//     setBlobUrl(null);
//     return undefined;
//   }, [file]);

//   // decide source URL to use (priority: file blob -> url)
//   const src = blobUrl || url || null;

//   // helper to detect type
//   const typeInfo = useMemo(() => {
//     // If we have a File object, use its mime if available
//     if (file && file.type) return { kind: file.type, ext: null };

//     // try to infer from url extension
//     if (src) {
//       const u = src.split("?")[0].split("#")[0];
//       const parts = u.split(".");
//       const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
//       // rough mapping
//       if (ext === "pdf") return { kind: "application/pdf", ext };
//       if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) return { kind: "image", ext };
//       if (["doc", "docx"].includes(ext)) return { kind: "word", ext };
//       if (["xls", "xlsx", "csv"].includes(ext)) return { kind: "excel", ext };
//       if (["ppt", "pptx"].includes(ext)) return { kind: "ppt", ext };
//       // fallback
//       return { kind: "unknown", ext };
//     }

//     return { kind: "unknown", ext: null };
//   }, [file, src]);

//   // Google Docs viewer helper (works for publicly accessible https urls)
//   const googleViewerUrl = (externalUrl) =>
//     `https://docs.google.com/gview?url=${encodeURIComponent(externalUrl)}&embedded=true`;

//   // Styles: make the viewer fill parent and be scrollable
//   const containerClass = "w-full h-full overflow-auto bg-white"; // parent controls border, padding, etc.
//   const iframeClass = "w-full h-full border-0"; // iframe takes full parent's available space
//   const imgClass = "max-w-full max-h-full block mx-auto"; // images scaled to fit; parent scrolls if too large

//   // Render logic
//   if (!src) {
//     return (
//       <div className={containerClass + " flex items-center justify-center"}>
//         <span className="text-sm text-gray-500">No file to preview</span>
//       </div>
//     );
//   }

//   // PDFs: render in iframe (scrollable)
//   if (typeInfo.kind === "application/pdf" || (file && file.type === "application/pdf")) {
//     return (
//       <div className={containerClass} style={{ minHeight: 0 }}>
//         {/* iframe will be scrollable inside parent */}
//         <iframe
//           title="pdf-viewer"
//           src={src}
//           className={iframeClass}
//           style={{ minHeight: "100%", height: "100%" }}
//         />
//       </div>
//     );
//   }

//   // Images
//   if (typeInfo.kind === "image" || (file && file.type.startsWith("image/"))) {
//     return (
//       <div className={containerClass + " flex items-center justify-center"} style={{ padding: 12 }}>
//         <img
//           src={src}
//           alt="preview"
//           className={imgClass}
//           style={{ objectFit: "contain", maxHeight: "100%" }}
//         />
//       </div>
//     );
//   }

//   // Office docs (doc/docx/ppt/xls) - try google viewer if url is public https
//   if (["word", "excel", "ppt"].includes(typeInfo.kind)) {
//     // google viewer requires public https url (won't work with blob URLs)
//     if (src && src.startsWith("http")) {
//       const gv = googleViewerUrl(src);
//       return (
//         <div className={containerClass} style={{ minHeight: 0 }}>
//           <iframe
//             title="office-viewer"
//             src={gv}
//             className={iframeClass}
//             style={{ minHeight: "100%", height: "100%" }}
//           />
//         </div>
//       );
//     }

//     // blob or non-public URL: suggest download / fallback
//     return (
//       <div className={containerClass + " flex flex-col items-center justify-center gap-3 p-4"}>
//         <div className="text-sm text-gray-600">This document can't be previewed in-browser.</div>
//         <a
//           href={src}
//           download
//           className="px-4 py-2 bg-blue-600 text-white rounded hover:opacity-90"
//         >
//           Download file
//         </a>
//       </div>
//     );
//   }

//   // Unknown types: attempt to iframe if the browser can display it, otherwise provide download
//   return (
//     <div className={containerClass} style={{ minHeight: 0 }}>
//       {/* try to show in iframe (some types like text/plain, html, etc work) */}
//       <iframe
//         title="file-preview"
//         src={src}
//         className={iframeClass}
//         style={{ minHeight: "100%", height: "100%" }}
//       />
//     </div>
//   );
// }





//¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬ for debugging not working ¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

// import { Divide } from "lucide-react";
// import React, { useEffect, useState } from "react";

// export default function PDFViewer({ file, url, onClose }) {
//   // const [pdfUrl, setPdfUrl] = useState(null);

//   // useEffect(() => {
//   //   let localUrl = null;

//   //   if(file instanceof Blob){
//   //     localUrl = URL.createObjectURL(file)
//   //     setPdfUrl(localUrl)
//   //   } else if(typeof url === "string") {
//   //     setPdfUrl(url)
//   //   }else{
//   //     setPdfUrl(null)
//   //   }

// return(<div>{console.log("file",file,"url",url,"onClose",onClose)}</div>)
//   //   return () => { if (localUrl) URL.revokeObjectURL(localUrl)}
//   // }, [file, url]);

//   // if (!pdfUrl)
//   //   return <p className="text-gray-500 text-center mt-4">No PDF to display.</p>;

//   // return (
//   //   <div className="relative w-full h-full border rounded-lg overflow-auto scrollbar-hidden bg-white shadow-md">
//   //     {/* Close button */}
//   //     {onClose && (
//   //       <button onClick={onClose} className="absolute top-2 right-2 z-10 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600" >
//   //         ✕
//   //       </button>
//   //     )}

//   //     <iframe src={pdfUrl} title="PDF Viewer" className="w-full h-full scrollbar-hidden border-none"/>
//   //   </div>
//   // );
// }

//                                     ______________________________________________________________________________________________________
// import React, { useEffect, useState } from "react";

// export default function PDFViewer({ file, url, onClose }) {
//   const [pdfUrl, setPdfUrl] = useState(null);

//   useEffect(() => {
//     let localUrl = null;

//     if(file instanceof Blob){
//       localUrl = URL.createObjectURL(file)
//       setPdfUrl(localUrl)
//     } else if(typeof url === "string") {
//       setPdfUrl(url)
//     }else{
//       setPdfUrl(null)
//     }


//     return () => { if (localUrl) URL.revokeObjectURL(localUrl)}
//     // if (file) {
//     //   const localUrl = URL.createObjectURL(file);
//     //   setPdfUrl(localUrl);
//     //   return () => URL.revokeObjectURL(localUrl);
//     // } else if (url) {
//     //   setPdfUrl(url);
//     // } else {
//     //   setPdfUrl(null);
//     // }
//   }, [file, url]);

//   if (!pdfUrl)
//     return <p className="text-gray-500 text-center mt-4">No PDF to display.</p>;

//   return (
//     <div className="relative w-full h-full border rounded-lg overflow-auto scrollbar-hidden bg-white shadow-md">
//       {/* Close button */}
//       {onClose && (
//         <button onClick={onClose} className="absolute top-2 right-2 z-10 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600" >
//           ✕
//         </button>
//       )}

//       <iframe src={pdfUrl} title="PDF Viewer" className="w-full h-full scrollbar-hidden border-none"/>

//     </div>
//   );
// }
//¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬ for debugging not working ¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬





























//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> this is my pretty working code don't do anything it works fine >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> this is my pretty working code don't do anything it works fine >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// import React, { useEffect, useState } from "react";

// export default function PDFViewer({ file, url, onClose }) {
//   const [pdfUrl, setPdfUrl] = useState(null);

//   useEffect(() => {
//     let localUrl = null;

//     if(file instanceof Blob){
//       localUrl = URL.createObjectURL(file)
//       setPdfUrl(localUrl)
//     } else if(typeof url === "string") {
//       setPdfUrl(url)
//     }else{
//       setPdfUrl(null)
//     }


//     return () => { if (localUrl) URL.revokeObjectURL(localUrl)}
//     // if (file) {
//     //   const localUrl = URL.createObjectURL(file);
//     //   setPdfUrl(localUrl);
//     //   return () => URL.revokeObjectURL(localUrl);
//     // } else if (url) {
//     //   setPdfUrl(url);
//     // } else {
//     //   setPdfUrl(null);
//     // }
//   }, [file, url]);

//   if (!pdfUrl)
//     return <p className="text-gray-500 text-center mt-4">No PDF to display.</p>;

//   return (
//     <div className="relative w-full h-full border rounded-lg overflow-auto scrollbar-hidden bg-white shadow-md">
//       {/* Close button */}
//       {onClose && (
//         <button onClick={onClose} className="absolute top-2 right-2 z-10 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600" >
//           ✕
//         </button>
//       )}

//       <iframe src={pdfUrl} title="PDF Viewer" className="w-full h-full scrollbar-hidden border-none"/>
//     </div>
//   );
// }



































//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> this is from the video i've watched from the youtube >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


// import React, { useEffect, useState } from "react";
// import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

// export default function FileViewer({ file, url }) {
//   const [docs, setDocs] = useState([]);

//   useEffect(() => {
//     if (file) {
//       const localUrl = URL.createObjectURL(file);
//       setDocs([{ uri: localUrl, fileName: file.name }]);

//       return () => URL.revokeObjectURL(localUrl);
//     }

//     if (url) {
//       setDocs([{ uri: url }]);
//     }
//   }, [file, url]);

//   return (
//     <div className="w-full h-full overflow-hidden">
//       <DocViewer
//         documents={docs}
//         pluginRenderers={DocViewerRenderers}
//         config={{
//           header: {
//             disableHeader: false,
//             disableFileName: false,
//           },
//         }}
//         style={{
//           height: "100%",
//           width: "100%",
//         }}
//       />
//     </div>
//   );
// }
