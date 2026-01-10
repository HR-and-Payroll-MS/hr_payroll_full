import React from 'react';
import { Bell } from 'lucide-react';

export default function ToastContainer({ toasts }) {
  return (
    <div className="fixed right-6 bottom-6 space-y-2">
      {toasts.map(t => (
        <div key={t.id} className="bg-white px-4 py-2 rounded shadow flex items-center gap-3">
          <Bell size={16} />
          <div className="text-sm">{t.msg}</div>
        </div>
      ))}
    </div>
  );
}
