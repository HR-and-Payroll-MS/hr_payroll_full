// import { createRoot } from "react-dom/client";
// import React, { useState, useRef, useEffect } from "react";
// import { createPortal } from "react-dom";

// function Drop({ targetRef, onClose, children }) {
//   const rect = targetRef.current?.getBoundingClientRect();
//   console.log(targetRef.current)

//   if (!rect) return null;

//   return createPortal(
//     <div
//       style={{
//         position: "absolute",
//         top: rect.bottom + window.scrollY,   // below the button
//         left: rect.left + window.scrollX,
//         background: "white",
//         border: "1px solid #ccc",
//         borderRadius: "6px",
//         boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
//         padding: "5px 0",
//         zIndex: 100,
//         minWidth: rect.width
//       }}
//     >
//       {children}

//       {/* Close dropdown on click outside */}
//       <div
//         onClick={onClose}
//         style={{
//           position: "fixed",
//           inset: 0,
//           background: "transparent",
//           pointerEvents: "auto",
//           zIndex: 1000
//         }}
//       />
//     </div>,





//     document.body // inject directly into body
//   );
// }

// function Dropdown() {
//   const [open, setOpen] = useState(false);
//   const buttonRef = useRef(null);
//   return (
//     <div style={{ padding: "100px" }}>
//             <button ref={buttonRef} onClick={() => setOpen(prev => !prev)} style={{ padding: "10px 15px", cursor: "pointer" }}>
//                 Open Dropdown
//             </button>

//             {open && (<Drop targetRef={buttonRef} onClose={() => setOpen(false)}>
//                         <div style={{ padding: "8px 12px", cursor: "pointer" }}>Profile</div>
//                         <div style={{ padding: "8px 12px", cursor: "pointer" }}>Settings</div>
//                         <div style={{ padding: "8px 12px", cursor: "pointer" }}>Logout</div>
//                         <div style={{ padding: "8px 12px", cursor: "pointer" }}>Logout</div>
//                         <div style={{ padding: "8px 12px", cursor: "pointer" }}>Logout</div>
//                         <div style={{ padding: "8px 12px", cursor: "pointer" }}>Logout</div>
//                         <div style={{ padding: "8px 12px", cursor: "pointer" }}>Logout</div>
//                         <div style={{ padding: "8px 12px", cursor: "pointer" }}>Logout</div>
//             </Drop>)}
//     </div>
// //   const [count, setCount]=useState(0);
// //   useEffect(()=>{
// //     let timer=setTimeout(() => {
// //     setCount(count+1)
// //   }, 1000) ;return ()=>clearTimeout(timer) },[open])
//     // <div>
//     //     <button onClick={()=>setOpen(!open)}>
//     //             change btn
//     //     </button>
//     //     <h1>{count}</h1>
//     // </div>
//   );
// }

// export default Dropdown;
