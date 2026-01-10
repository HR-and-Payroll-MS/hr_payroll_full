import React from "react";
import FileUploader from '../FileUploader';
import { FileUp, CloudUpload } from "lucide-react";

const StepDocument = ({ data , onChange }) => {
    const handleFileSelect = (file) => {
        onChange({ files: file });
    };

    const employmentInfo = (
        <div className="bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-all border border-slate-100 dark:border-transparent min-h-[400px] flex flex-col">
            {/* Header */}
            <div className="flex mx-4 py-4 border-b dark:border-slate-700 items-center">
                <p className="flex-1 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Personal Documents</p>
                <FileUp size={18} className="opacity-60 text-emerald-500 dark:text-emerald-400" />
            </div>

            {/* Upload Area */}
            <div className="p-6 flex-1 flex flex-col">
                <FileUploader 
                    data={data} 
                    onFileSelect={handleFileSelect} 
                    className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all flex flex-col gap-2 p-8 justify-center items-center cursor-pointer group"
                >
                    {/* Illustration / Icon */}
                    <div className="mb-4 relative">
                        <img className="h-24 w-auto object-center opacity-80 group-hover:scale-105 transition-transform" src="/pic/F2.png" alt="Upload illustration" />
                        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-md text-emerald-500">
                            <CloudUpload size={20} />
                        </div>
                    </div>

                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                        Drag & Drop here to upload
                    </p>
                    
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                        Or select file from your computer
                    </p>

                    {/* Optional: Small helper text */}
                    <div className="mt-4 px-4 py-1 bg-slate-100 dark:bg-slate-700/50 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Supported: PDF, PNG, JPG (Max 5MB)
                    </div>
                </FileUploader>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-4 scrollbar-hidden overflow-y-scroll pb-10 h-full">
            {employmentInfo}
        </div>
    );
};

export default StepDocument;