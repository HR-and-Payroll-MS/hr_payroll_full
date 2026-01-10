import React, { useEffect, useState } from "react";
import { fetchMyAttendance } from "../api";
import AttendanceSummaryCards from "./AttendanceSummaryCards";
import AttendanceHeatmap from "./AttendanceHeatmap";
import AttendanceTrendChart from "./AttendanceTrendChart";

export default function  MyAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await fetchMyAttendance();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch attendance", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !data) return <div className="p-6">Loading your attendance...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <img
          src="/pic/default-avatar.png"
          alt="Profile"
          className="h-16 w-16 rounded-full object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold">My Attendance</h1>
          <p className="text-sm text-slate-500">Your attendance overview and statistics</p>
        </div>
      </div>

      {/* Summary */}
      <AttendanceSummaryCards
        data={{
          totalDays: data.summary.totalDays,
          present: data.summary.present,
          absent: data.summary.absent,
          late: data.summary.late,
          leave: `${data.summary.leaveTaken}/${data.summary.leaveRemaining}`,
        }}
      />

      {/* Calendar Heatmap */}
      <div className="bg-white border rounded-lg shadow-sm p-4">
        <h2 className="font-semibold mb-2">Attendance Calendar</h2>
        <p className="text-xs text-slate-500 mb-3">
          Each day’s color indicates your presence level — darker = more consistent presence.
        </p>
        <div className="h-[200px] md:h-[280px]">
          <AttendanceHeatmap data={data.activity} />
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white border rounded-lg shadow-sm p-4">
        <h2 className="font-semibold mb-2">Monthly Attendance Trend</h2>
        <p className="text-xs text-slate-500 mb-3">
          Track your attendance stats across months.
        </p>
        <div className="h-[280px]">
          <AttendanceTrendChart data={data.trend} />
        </div>
      </div>
    </div>
  );
}
