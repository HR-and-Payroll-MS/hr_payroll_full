import React, { useMemo, useState } from "react";
import FileDrawer from "../../../Components/FileDrawer";
import useAuth from "../../../Context/AuthContext";

function PayrollReportDrawer({ data, onActionComplete }) {
  const { axiosPrivate } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [localStatus, setLocalStatus] = useState(data?.status);
  const [reason, setReason] = useState("");

  const canAct = useMemo(() => {
    return ["pending_approval", "approved"].includes(localStatus);
  }, [localStatus]);

  const handleFinalize = async () => {
    if (!data?.id) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await axiosPrivate.post(`/payroll/periods/${data.id}/finalize/`);
      setLocalStatus("finalized");
      setSuccess("Payroll finalized successfully.");
      if (onActionComplete) onActionComplete({ id: data.id, status: "finalized" });
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to finalize payroll.");
    } finally {
      setBusy(false);
    }
  };

  const handleRollback = async () => {
    if (!data?.id) return;
    if (!reason.trim()) {
      setError("Please provide a reason for rollback.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await axiosPrivate.post(`/payroll/periods/${data.id}/rollback/`, { reason });
      setLocalStatus("rolled_back");
      setSuccess("Payroll rolled back to Payroll Officer.");
      if (onActionComplete) onActionComplete({ id: data.id, status: "rolled_back" });
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to rollback payroll.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-xl font-semibold mb-3">Payroll Report - {data?.month}</h2>

      <div className="space-y-2 text-sm">
        <p>
          <strong>Total Employees:</strong> {data?.totalEmployees}
        </p>
        <p>
          <strong>Total Payout:</strong> ${data?.totalPayout?.toLocaleString()}
        </p>
        <p>
          <strong>Status:</strong> {localStatus}
        </p>
      </div>

      {/* Actions for HR Manager */}
      {canAct && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-600">Rollback Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason for rollback"
              className="w-full border rounded px-2 py-1 text-sm"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRollback}
              disabled={busy}
              className="px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Rollback
            </button>
            <button
              onClick={handleFinalize}
              disabled={busy}
              className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Finalize
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="mt-3 text-sm text-emerald-700">{success}</div>
      )}
    </div>
  );
}

export default PayrollReportDrawer;
