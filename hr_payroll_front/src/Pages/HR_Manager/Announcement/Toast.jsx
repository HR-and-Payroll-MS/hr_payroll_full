import React from "react";

/* Simple toast. Keep or replace with your existing toast system */
export default function Toast({ type = "info", message = "" }) {
  const bg = type === "success" ? "bg-green-600" : type === "info" ? "bg-indigo-600" : "bg-gray-600";
  return (
    <div className="fixed right-6 bottom-6 z-50">
      <div className={`${bg} text-white px-4 py-2 rounded shadow`}>{message}</div>
    </div>
  );
}
