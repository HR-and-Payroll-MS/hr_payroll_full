import React, { useState, useRef, useEffect } from "react";
import Dropdown from "../../../Components/Dropdown";
import TextEditor from "../../../Components/TextEditor";
import SocialPost from "./SocialPost"; 
import { useAnnouncements } from "../../../Context/AnnouncementContext";

export default function CreateAnnouncement({ initialData = null, onClose = null, forceOpen = false }) {
  const { publishAnnouncement, updateAnnouncement } = useAnnouncements();
  const [open, setOpen] = useState(forceOpen || !!initialData);
  const [step, setStep] = useState(1); 
  const [title, setTitle] = useState(initialData?.title || "");
  const [body, setBody] = useState(initialData?.content || "");
  const [priority, setPriority] = useState(initialData?.priority || "Normal");
  const [attachments, setAttachments] = useState([]); 
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setBody(initialData.content || "");
      setPriority(initialData.priority || "Normal");
      
      // Load existing attachments
      if (initialData.attachments && Array.isArray(initialData.attachments)) {
        setAttachments(initialData.attachments.map(a => ({
          // For existing files, we might not have the File object, just URL
          // We mark them so we don't re-upload unless necessary (though backend handles append)
          // Or we keep them as reference for UI
          url: a.file, // Assuming backend returns full URL or path
          type: a.file_type || 'file',
          name: a.file ? a.file.split('/').pop() : 'Attachment',
          isExisting: true,
          id: a.id
        })));
      }
      setOpen(true);
    }
  }, [initialData]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => {
      const type = file.type.split('/')[0];
      return {
        file,
        name: file.name,
        type: ['image', 'video', 'audio'].includes(type) ? type : 'file',
        url: URL.createObjectURL(file),
        size: (file.size / 1024).toFixed(1) + " KB",
        isExisting: false
      };
    });
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const handlePublish = async () => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', body);
    formData.append('priority', priority);
    attachments.forEach(item => {
        formData.append('attachments', item.file);
    });

    try {
      if (initialData?.id || initialData?._id) {
        await updateAnnouncement(initialData.id || initialData._id, formData);
      } else {
        await publishAnnouncement(formData);
      }
      resetForm();
    } catch (err) {
      alert("Failed to save.");
    }
  };

  const resetForm = () => {
    attachments.forEach(a => URL.revokeObjectURL(a.url));
    setOpen(false); 
    setStep(1); 
    setTitle(""); 
    setBody(""); 
    setAttachments([]);
    if (onClose) onClose();
  };

  if (!open && !forceOpen) return (
    <button 
      onClick={() => setOpen(true)} 
      className="bg-[#052f4a] text-white px-6 py-2 rounded shadow dark:shadow-black font-bold hover:bg-slate-800 transition flex items-center gap-2 text-sm uppercase tracking-wider"
    >
      <span>+</span> Create Announcement
    </button>
  );

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-gray-50 dark:bg-slate-700 w-full max-w-4xl rounded shadow-2xl dark:shadow-black dark:inset-shadow-xs flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-600 animate-scaleIn">
        
        <div className="p-5 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center bg-white dark:bg-slate-800">
          <div>
            <h2 className="font-bold text-xl text-slate-800 dark:text-white uppercase tracking-tight">
              {initialData ? (step === 1 ? "Edit Announcement" : "Review Updates") : (step === 1 ? "New Internal Announcement" : "Review Publication")}
            </h2>
            <p className="text-[10px] uppercase font-bold text-slate-400">
              {step === 1 ? "Configure communication details" : "Final view before employee broadcast"}
            </p>
          </div>
          <button onClick={resetForm} className="text-slate-400 hover:text-red-500 transition-colors text-2xl">×</button>
        </div>
        
        <div className="p-6 overflow-y-auto scrollbar-hidden space-y-6">
          {step === 1 ? (
            <div className="flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">Priority</label>
                  <Dropdown 
                    onChange={setPriority} 
                    value={priority}
                    options={[{content:'Normal'},{content:'High'},{content:'Urgent'}]} 
                    placeholder="Select Priority" 
                    padding="p-2 w-full" 
                    className="bg-white dark:bg-slate-800 border rounded shadow-sm"
                  />
                </div>
                <div className="md:col-span-3 flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">Headline / Subject</label>
                  <input 
                    className="w-full bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded p-2 text-sm font-semibold outline-none focus:ring-1 ring-[#052f4a]" 
                    placeholder="e.g. Monthly Town Hall Meeting..." 
                    value={title} 
                    onChange={(e)=>setTitle(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">Message Body</label>
                <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 p-2 min-h-[300px] shadow-inner">
                  <TextEditor value={body} onChange={setBody} />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">New Media Attachments</label>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {attachments.map((f, i) => (
                    <div key={i} className="relative aspect-square bg-slate-200 dark:bg-slate-800 rounded border dark:border-slate-500 overflow-hidden group">
                      {f.type === 'image' ? <img src={f.url} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-[9px] font-bold text-slate-500 p-2 text-center break-all uppercase">{f.name}</div>}
                      <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md">×</button>
                    </div>
                  ))}
                  <div 
                    className="border-2 border-dashed border-slate-300 dark:border-slate-500 rounded aspect-square flex flex-col items-center justify-center bg-white dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <span className="text-xl">+</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Add File</span>
                    <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                  </div>
                </div>
                {initialData && <p className="text-[10px] text-slate-400 italic mt-1 font-bold">Existing attachments are preserved. Only new files will be uploaded.</p>}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 p-6 rounded shadow-inner min-h-[400px]">
               <SocialPost 
                 announcement={{ 
                   title, 
                   content: body, 
                   priority, 
                   attachments: [
                     ...(initialData?.attachments || []),
                     ...attachments.map(a => ({ 
                       file_type: a.type, 
                       file: a.url, 
                       id: a.name 
                     }))
                   ], 
                   created_at: initialData?.created_at || new Date().toISOString()
                 }} 
                 isDetailView={true} 
               />
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-slate-600 flex gap-4 bg-white dark:bg-slate-800">
          {step === 1 ? (
            <button 
              disabled={!title || !body} 
              onClick={() => setStep(2)} 
              className="ml-auto bg-[#052f4a] text-white font-bold px-8 py-3 rounded uppercase text-xs tracking-widest disabled:opacity-20 hover:bg-slate-800 transition shadow-md active:scale-95"
            >
              Continue to Preview
            </button>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="px-6 py-3 bg-slate-100 dark:bg-slate-600 dark:text-white font-bold rounded uppercase text-xs">Back to Edit</button>
              <button onClick={handlePublish} className="ml-auto bg-green-700 text-white font-bold px-10 py-3 rounded shadow-lg uppercase text-xs tracking-widest hover:bg-green-800 transition active:scale-95">
                {initialData ? "Apply Changes" : "Confirm & Publish"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}