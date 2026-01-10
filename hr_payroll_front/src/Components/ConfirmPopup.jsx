import React from "react";
import Modal from "./Modal";
import { X } from "lucide-react";

export default function ConfirmPopup({
  isOpen,
  message = "Are you sure?",
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "Cancel",
  location = "center" ,
  subMessage="",
  noCancel=false

}) {
  return (
    <Modal isOpen={isOpen} location={location}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-5 w-96 flex flex-col gap-4">
        
        {/* Close icon */}
        <div className="flex justify-end">
          <button 
            onClick={onCancel} 
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message */}
        <div className="text-center text-xl text-slate-800 dark:text-slate-100 font-semibold">
          {message}
        </div>
        <div className="flex text-normal font-medium text-slate-400 justify-center flex-wrap">
        {subMessage && subMessage}
            </div>
        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-3">
          {!noCancel&&<button
            onClick={onCancel}
            className="px-4 py-2 flex-1 cursor-pointer rounded-md border hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            {cancelText}
          </button>}
          <button
            onClick={onConfirm}
            className="px-4 py-2 flex-1 cursor-pointer rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
