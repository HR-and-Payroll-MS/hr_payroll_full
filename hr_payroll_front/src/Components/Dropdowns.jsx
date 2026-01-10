import { createPortal } from "react-dom";

export default function Dropdowns({targetRef ,onClose }){
    const ref=targetRef.current?.getBoundingClientRect();
    if(!ref) return null;
    
return createPortal(
    <div className="absolute  text-sm text-slate-800 bg-slate-50 rounded shadow-md z-50" style={{ 
        top: ref.bottom + window.scrollY,   // below the button
        left: ref.left + window.scrollX,
        minWidth: ref.width}}>
          <div className="flex px-4 py-1.5 text-yellow-500 bg-white flex-col gap-0.5">
                            <div className="hover:text-red-800">Active</div>
                            <div className="hover:text-red-800">On Boarding</div>
                            <div className="hover:text-red-800">Probation</div>
                            <div className="hover:text-red-800">On Leave</div>
                        </div>
         <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "transparent",
          pointerEvents: "auto",
          zIndex: 1000
        }}
      />
    </div>,document.body
)}