// src/components/DocumentsTable.jsx
import React from 'react';

export default function DocumentsTable({
  documents = [],
  loading,
  onPreview,
  onDelete,
}) {
  return (
    <div className="bg-white dark:bg-slate-800 border rounded">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Uploaded Documents</h3>
          <div className="text-sm text-slate-500">
            All uploads for the selected employee
          </div>
        </div>
        <div className="text-sm text-slate-500">
          {loading ? 'Loading...' : `${documents.length} documents`}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2">Document</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Uploaded On</th>
              <th className="px-4 py-2">Uploaded By</th>
              <th className="px-4 py-2">Notes</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {documents.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No documents uploaded yet.
                </td>
              </tr>
            )}

            {documents.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded">
                      {d.fileType?.startsWith('image')
                        ? 'IMG'
                        : d.fileType === 'application/pdf'
                        ? 'PDF'
                        : 'DOC'}
                    </div>
                    <div>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-slate-500">{d.fileName}</div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 text-sm">{d.type}</td>
                <td className="px-4 py-3 text-sm">
                  {new Date(d.uploadedOn).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">{d.uploadedBy}</td>
                <td className="px-4 py-3 text-sm">{d.notes}</td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPreview(d)}
                      className="text-sm px-2 py-1 border rounded"
                    >
                      Preview
                    </button>
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm px-2 py-1 border rounded"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => onDelete(d.id)}
                      className="text-sm px-2 py-1 border rounded text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
