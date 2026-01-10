import React from "react";
import Dropdown from '../Dropdown';
import { Banknote } from "lucide-react";

const status = ["Active", "Inactive", "Terminated", "On Leave"];

const StepPayroll = ({ data, onChange }) => {
    const employmentInfo = (
        <div className="bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-all border border-slate-100 dark:border-transparent">
            {/* Header with Green Icon Accent */}
            <div className="flex mx-4 py-4 border-b dark:border-slate-700 items-center">
                <p className="flex-1 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Payroll & Status Information</p>
                <Banknote size={18} className="opacity-60 text-emerald-500 dark:text-emerald-400" />
            </div>

            <div id="left" className="flex gap-5 p-4 justify-start items-start flex-wrap">
                {/* Employee Status Dropdown */}
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Employee Status</p>
                    <div className="w-full">
                        <Dropdown padding='p-1.5' options={status} onChange={(e) => onChange({ employeestatus: e })} />
                    </div>
                </div>

                {/* Last Working Date */}
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Last Working Date</p>
                    <input type="date" value={data.lastworkingdate} onChange={(e) => onChange({ lastworkingdate: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-emerald-500 transition-all shadow-sm" />   
                </div>

                {/* Salary */}
                <div className="w-96 flex gap-2 text-nowrap items-center group">
                    <p className="min-w-40 text-xs font-bold text-emerald-600/70 dark:text-emerald-500/50 uppercase tracking-tighter">salary</p>
                    <input type="number" value={data.salary} onChange={(e) => onChange({ salary: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-emerald-500 transition-all shadow-sm font-medium" />   
                </div>

                {/* Offset */}
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">offset</p>
                    <input type="number" value={data.offset} onChange={(e) => onChange({ offset: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-emerald-500 transition-all shadow-sm" />   
                </div>

                {/* Onset / Oneoff */}
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Onset</p>
                    <input type="number" value={data.oneoff} onChange={(e) => onChange({ oneoff: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-emerald-500 transition-all shadow-sm" />   
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-4 scrollbar-hidden overflow-y-scroll pb-10">
            {employmentInfo}
        </div>
    );
};

export default StepPayroll;