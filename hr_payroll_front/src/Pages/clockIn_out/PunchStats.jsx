import React from "react";
import { MapPin } from "lucide-react";

export default function PunchStats({ punches, lastPunch }) {
  const totalMinutes = punches.reduce((acc, p, i, arr) => {
    if (p.type === "check_in" && arr[i + 1]?.type === "check_out") {
      const diff = new Date(arr[i + 1].time) - new Date(p.time);
      return acc + diff / 60000;
    }
    return acc;
  }, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-md">
      <div className="p-4 bg-white rounded-xl shadow flex flex-col items-center">
        <div className="text-sm text-gray-400">Total Hours Today</div>
        <div className="text-lg font-semibold">{`${hours}h ${minutes}m`}</div>
      </div>
      <div className="p-4 bg-white rounded-xl shadow flex flex-col items-center">
        <div className="text-sm text-gray-400">Last Location</div>
        <div className="text-lg font-semibold flex items-center gap-1">
          <MapPin className="w-4 h-4 text-indigo-500" />
          {lastPunch?.location || "Unknown"}
        </div>
      </div>
    </div>
  );
}
