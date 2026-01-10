import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

export default function Drawer({ isOpen, onClose, children, width = "w-1/2" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Drawer content max-w-lg*/}
          <motion.div
            className={`relative bg-white dark:bg-slate-800 h-full ${width}  p-6 shadow-xl`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            {/* Close button (Chevron) */}
            <button
              onClick={onClose}
              className="absolute goBeyond top-1/2 -translate-x-1/2 transform bg-white dark:bg-slate-700 rounded-full shadow-lg p-1.5 hover:scale-110 transition"
            >
              <ChevronRight className="h-5 w-5 text-gray-700 dark:text-slate-100" />
            </button>

            {/* Drawer children (your content inside the modal) */}
            <div className="h-full scrollbar-hidden overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}