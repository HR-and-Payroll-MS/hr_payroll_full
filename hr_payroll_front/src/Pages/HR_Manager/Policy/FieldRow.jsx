export default function FieldRow({ label, value, editable, onChange }) {
  return (
    <div className="flex items-center gap-4 py-1">
      {/* LABEL STYLE */}
      <div className="w-40 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </div>

      {editable ? (
        /* EDITABLE INPUT STYLE */
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded px-3 py-2 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-slate-800 dark:focus:ring-green-800 outline-none text-slate-700 dark:text-slate-200 transition-all"
        />
      ) : (
        /* READ-ONLY DISPLAY STYLE */
        <div className="font-bold text-sm text-slate-800 dark:text-slate-200 px-3 py-2">
          {value || (
            <i className="font-medium text-slate-300 dark:text-slate-600 italic">
              Not set
            </i>
          )}
        </div>
      )}
    </div>
  );
}