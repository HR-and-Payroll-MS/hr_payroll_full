// src/components/PayslipList.jsx
import React, { useState } from "react";

export default function PayslipList({ onSelect }) {
  // Static dummy data (you can replace with actual API response later)
  const [keys, setKeys] = useState([
    "EMP001",
    "EMP002",
    "EMP003"
  ]);

  async function refresh() {
    // For now: static data
    // Replace with your real logic later
    setKeys([...keys]);
  }

  async function handleDelete(key) {
    if (!confirm("Delete payslip " + key + " ?")) return;

    // For now: remove locally (no IndexedDB)
    setKeys((prev) => prev.filter((k) => k !== key));

    // Later: replace this with IDB or API delete call
    await refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Stored Payslips (Static Example)</h3>
        <button onClick={refresh} className="text-sm text-slate-600">
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {keys.length === 0 && (
          <div className="text-sm text-slate-500">
            No stored payslips yet.
          </div>
        )}

        {keys.map((k) => {
          const [eid, month] = k.split("_");
          return (
            <div
              key={k}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div>
                <div className="font-medium">{eid}</div>
                <div className="text-xs text-slate-500">{month}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSelect(k)}
                  className="px-3 py-1 bg-slate-100 rounded text-sm"
                >
                  View
                </button>
                <button
                  onClick={() => handleDelete(k)}
                  className="px-3 py-1 bg-red-100 rounded text-sm text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
