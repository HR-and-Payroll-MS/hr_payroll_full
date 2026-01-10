import { useEffect, useState ,useRef } from "react";
import Icon from "./Icon";


function useOutside(ref, onOutside) {
  useEffect(() => {
    function onDown(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      onOutside && onOutside();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, onOutside]);
}

export default function DropDownContent({ children , svgs }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  
  useOutside(ref, () => setOpen(false));

  function handleOpen() {
    setOpen((v) => !v);
  }

  return (
  <div className="relative" ref={ref}>
    {/* TRIGGER BUTTON */}
    <button 
      onClick={handleOpen} 
      className="relative p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
    >
      <div className="opacity-70 group-hover:opacity-100 transition-opacity dark:invert">
        {svgs}
      </div>
    </button>

    {open && (
      <div 
        onClick={() => setOpen(false)} 
        className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 rounded shadow-2xl z-50 dark:shadow-2xl dark:inset-shadow-2xs dark:inset-shadow-slate-700 inset-shadow-2xs inset-shadow-white flex flex-col animate-scaleIn overflow-hidden border border-slate-100 dark:border-transparent"
      >
        <div className="flex flex-col py-1">
          {/* Note: For the best look, ensure the 'children' (buttons/links) 
            inside use: text-[10px] uppercase font-bold tracking-wider 
          */}
          {children}
        </div>
      </div>
    )}
  </div>
);
}
