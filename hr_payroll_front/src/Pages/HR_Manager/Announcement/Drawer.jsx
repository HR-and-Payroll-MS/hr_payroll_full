import React from "react";
export default function Drawer({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-xl h-full bg-white shadow-xl overflow-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-medium">Details</div>
          <button onClick={onClose} className="text-gray-600">Close</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
