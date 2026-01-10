import React, { useState, useEffect } from "react";
import useAuth from "../Context/AuthContext";
import useSocketEvent from "../Hooks/useSocketEvent";

export default function ViewRequestForEmployees({
  status = "all",
  date = "all",
  q = "",
}) {
  const { axiosPrivate, auth } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Auto-refresh on socket event
  useSocketEvent('leave_updated', () => {
    setRefreshTrigger((prev) => prev + 1);
  });
  
  const toggleOpen = (id) => setOpenId((prev) => (prev === id ? null : id));

  // Fetch employee's own leave requests
  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        setLoading(true);
        const employeeId = auth?.user?.employee_id;
        const url = employeeId 
          ? `/leaves/requests/?employee=${employeeId}`
          : '/leaves/requests/';
        
        const response = await axiosPrivate.get(url);
        const requests = response.data.results || response.data || [];
        
        // Transform to match expected format
        const transformed = requests.map(req => ({
          id: req.id,
          type: req.leave_type?.charAt(0).toUpperCase() + req.leave_type?.slice(1) || 'Leave',
          startDate: req.start_date,
          endDate: req.end_date,
          status: req.status?.charAt(0).toUpperCase() + req.status?.slice(1) || 'Pending',
          progress: (req.approval_chain || []).map(ac => 
            `${ac.role} ${ac.status === 'approved' ? 'approved' : ac.status === 'denied' ? 'denied' : 'pending'}`
          ),
          employeeMessage: req.reason,
          comments: (req.approval_chain || [])
            .filter(ac => ac.comment)
            .map(ac => ({
              from: ac.role,
              message: ac.comment
            }))
        }));
        
        setData(transformed);
      } catch (error) {
        console.error('Failed to fetch leave requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMyRequests();
  }, [axiosPrivate, auth?.user?.employee_id, refreshTrigger]);

  // DATE FILTER PARSING
  let from = null;
  let to = null;

  if (date !== "all") {
    if (date.includes(":")) {
      [from, to] = date.split(":");
    } else {
      from = date;
      to = date;
    }
  }

  const filtered = data.filter((req) => {
    // STATUS
    if (status !== "all" && req.status.toLowerCase() !== status) {
      return false;
    }

    // DATE
    if (from && to) {
      if (req.endDate < from || req.startDate > to) {
        return false;
      }
    }

    // SEARCH
    if (q) {
      const text = [
        req.type,
        req.employeeMessage,
        ...(req.comments || []).map((c) => `${c.from} ${c.message}`),
      ]
        .join(" ")
        .toLowerCase();

      if (!text.includes(q.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="mx-auto mt-8 text-center text-slate-500 dark:text-slate-400">
        Loading your leave requests...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="mx-auto mt-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">No leave requests found.</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Submit a new request using the "Send Request" tab.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8">
      <div className="space-y-4">
        {filtered.map((req) => (
          <div
            key={req.id}
            className="rounded-lg shadow p-4 bg-white cursor-pointer dark:bg-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            onClick={() => toggleOpen(req.id)}
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold dark:text-slate-50">
                  {req.type} Leave ({req.startDate} - {req.endDate})
                </p>
                <p className="text-sm dark:text-slate-400 text-gray-500">
                  {req.status}
                </p>
              </div>

              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  req.status.toLowerCase() === "approved"
                    ? "bg-green-100 text-green-800"
                    : req.status.toLowerCase() === "denied"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {req.status}
              </span>
            </div>

            {/* Progress */}
            <div className="mt-2 text-sm dark:text-slate-300 text-gray-600">
              Progress:{" "}
              {req.progress.length > 0 ? (
                req.progress.map((step, i) => (
                  <span key={i}>
                    {step}
                    {i < req.progress.length - 1 ? " → " : ""}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">Awaiting review</span>
              )}
            </div>

            {/* Expanded */}
            {openId === req.id && (
              <div className="mt-4 border-t pt-2 dark:border-slate-400 space-y-2 text-sm dark:text-slate-200 text-gray-700">
                {req.employeeMessage && (
                  <div>
                    <p className="font-semibold">Your Message:</p>
                    <p>{req.employeeMessage}</p>
                  </div>
                )}

                {req.comments.length > 0 ? (
                  <div>
                    <p className="font-semibold">Comments:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {req.comments.map((c, i) => (
                        <li key={i}>
                          <span className="font-semibold">{c.from}:</span>{" "}
                          {c.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No comments yet.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
