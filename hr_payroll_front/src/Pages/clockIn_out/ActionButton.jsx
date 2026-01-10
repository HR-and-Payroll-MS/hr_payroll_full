import React from "react";
import { motion } from "framer-motion";

export default function ActionButton({ isClockedIn, hasCheckedOut, actionLoading, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={actionLoading || hasCheckedOut}
      className={`w-52  h-52 rounded-full animate- shadow-2xl flex items-center justify-center text-xl font-bold text-white transition-all
        ${hasCheckedOut ? "bg-gray-400 cursor-not-allowed" : isClockedIn ? "bg-red-600" : "bg-green-600"}`}
    >
      {/* <div className="loader absolute"></div> */}
      {actionLoading
        ? "Processing..."
        : hasCheckedOut
        ? "Day Complete"
        : isClockedIn
        ? "CLOCK OUT"
        : "CLOCK IN"}
    </motion.button>
  );
}
