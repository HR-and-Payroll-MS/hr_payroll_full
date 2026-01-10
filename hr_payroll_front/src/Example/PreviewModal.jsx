// src/components/PreviewModal.jsx
import React from 'react';

export default function PreviewModal({ doc, onClose }) {
  if (!doc) return null;

  const isImage = doc.fileType?.startsWith('image');
  const isPdf = doc.fileType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 w-[90%] md:w-3/4 lg:w-2/3 h-[80%] rounded shadow p-4 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{doc.name}</h3>
          <button onClick={onClose} className="text-slate-500">
            Close
          </button>
        </div>

        <div className="h-full">
          {isImage && (
            <img
              src={doc.fileUrl}
              alt={doc.name}
              className="mx-auto max-h-full object-contain"
            />
          )}
          {isPdf && (
            <iframe
              title={doc.name}
              src={doc.fileUrl}
              className="w-full h-full border"
            />
          )}
          {!isImage && !isPdf && (
            <div className="p-6 text-center">
              <p className="mb-4">No inline preview for this file type.</p>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Open / Download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
