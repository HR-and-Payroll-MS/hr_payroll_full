import React, { useState, useRef, useEffect } from 'react';
import FileDrawer from '../Components/FileDrawer';
import Dropdown from '../Components/Dropdown';
import FileUploader from '../Components/FileUploader';
import Icon from '../Components/Icon';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const DOC_TYPES = [{svg:null,content:'ID Card'}, {svg:null,content:'Contract'}, {svg:null,content:'Tax Form'}, {svg:null,content:'Certificate'}, {svg:null,content:'Other'}];
export default function UploadDrawer({open,onClose,employee,onUpload,uploading,}) {

  console.log(employee)
  const [type, setType] = useState(DOC_TYPES[0].content);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [hasFile, setHasFile] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!open) {
      setType(DOC_TYPES[0].content);
      setNotes('');
      setFiles([]);
      setProgress(0);
    }
  }, [open]);
  // console.log('Selected Employee in UploadDrawer:', employee);
  const handleSubmit = async () => {
    if (!employee) {
      alert('Please select an employee before uploading.');
      return;
    }
    if (!type) {
      alert('Please select a document type.');
      return;
    }
    if (files.length === 0) {
      alert('Please pick at least one file to upload.');
      return;
    }
    try {
      await onUpload({ files, type, notes , onProgress: (p) => setProgress(p),});
      //  console.log({ files, type, notes , onProgress: (p) => setProgress(p),});
      // optional: success toast
    } catch (err) {
      console.error('upload err', err);
      alert('Upload failed');
    }
  };
  const hi = (file) => {
  setFiles(prev => ({
    ...prev,
    files: [file]   // or [...prev.files, file] for multiple uploads
  }));
  setHasFile(true)
};
  return (
  open && (
    <FileDrawer isModalOpen={open} closeModal={onClose}>
      <aside className="ml-auto w-full h-full p-6 flex flex-col gap-6 overflow-y-auto bg-white dark:bg-slate-800 transition-colors scrollbar-hidden">
        
        {/* HEADER SECTION */}
        <div className="flex items-center justify-between border-b dark:border-slate-700 pb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Icon name="Upload" className="text-blue-500" size={20} /> Upload Document
          </h2>
        </div>

        <div className="space-y-6">
          {/* EMPLOYEE INFO CARD - Styled like your Dashboard stats */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-2 block tracking-wider">Target Employee</label>
            {employee ? (
              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 flex items-center gap-4 border border-transparent transition-all">
                {employee?.general?.photo ? (
                  <img
                    src={`${BASE_URL}${employee.general.photo}`}
                    alt=""
                    className="h-12 w-12 rounded-full border-2 border-white dark:border-slate-500 object-cover shadow-sm"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-slate-800 dark:bg-slate-600 text-slate-100 flex items-center justify-center text-lg font-bold border-2 border-white dark:border-slate-500 shadow-sm">
                    {(employee?.general?.fullname || "NA")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">{employee?.general?.fullname}</div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    {employee?.job?.employeeid} <Icon name="Dot" size={14} /> {employee?.job?.department}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded text-sm font-medium border border-red-100 dark:border-red-900/30">
                ⚠️ Please select an employee first to continue.
              </div>
            )}
          </div>

          {/* DOCUMENT TYPE SELECTOR */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-2 block tracking-wider">Document Type</label>
            <Dropdown 
              placeholder='Select category...' 
              options={DOC_TYPES} 
              onChange={(e) => setType(e)}
              // Note: Ensure your Dropdown component accepts className or style it internally like your "Location" select
              className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 rounded px-4 py-2 transition-all"
            />
          </div>

          {/* NOTES AREA - Styled like your Correction Notes */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-2 block tracking-wider">Correction Notes (Optional)</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Add details about this document..."
              className="w-full bg-gray-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none shadow-sm dark:shadow-black" 
              rows={3} 
            />
          </div>

          {/* FILE UPLOADER - Modernized Zone */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-2 block tracking-wider">Attachment</label>
            <FileUploader 
              data={files} 
              onFileSelect={(e) => hi(e)} 
              className="group flex flex-col gap-3 p-8 justify-center items-center border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 bg-gray-50 dark:bg-slate-900/30 transition-all cursor-pointer"
            >
              <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                <Icon name="UploadCloud" size={28} className="text-blue-500" />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Click or drag to upload</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  PDF, PNG, JPG, or DOCX (Max 10MB)
                </div>
              </div>
            </FileUploader>

            {/* PROGRESS BAR */}
            {progress > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-bold uppercase mb-1 text-slate-500">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                  <div 
                    style={{ width: `${progress}%` }} 
                    className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ACTION FOOTER */}
        <div className="mt-auto pt-6 border-t dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
            Cancel
          </button>
          {hasFile && (
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className={`flex items-center gap-2 px-6 py-2 rounded text-sm font-bold shadow-md transition-all ${
                uploading 
                ? "bg-slate-200 dark:bg-slate-600 text-slate-400 cursor-not-allowed" 
                : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 active:scale-95"
              }`}
            >
              {uploading ? (
                <> <Icon name="Loader2" className="animate-spin" size={16} /> Processing... </>
              ) : (
                <> <Icon name="Check" size={16} /> Complete Upload </>
              )}
            </button>
          )}
        </div>
      </aside>
    </FileDrawer>
  )
);


}
