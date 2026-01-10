import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
function Modal({ isOpen, onClose, children}){
    if(!isOpen) return null;
    return createPortal(
    <div onClick={onClose} className='bg-gray-900/40 flex z-50 w-full h-full justify-end items-center absolute top-0 '>
        <p className='p-32 flex w-2/6 justify-center items-center text-center  h-full bg-pink-100'>
            hello bitch{children}
        </p>
    </div>,document.body)



//     return createPortal(
//         <div style={{
//             position:'fixed',
//             top:0,left:0,right:0,bottom:0, backgroundColor:'rgba(0,0,0,0.5)',display:'flex',
//             alignItems:'center',justifyContent:'center'
//         }
//         }>
// <div style={{background:'white',padding:'20px',borderRadius:'8px'}}>{children}
//     <button onClick={onClose}>Close</button>

// </div>
//         </div>
//     )
}
export default function Example(){
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div>
            <h1>MY AOO</h1>
            <button className='bg-amber-500' onClick={()=>setIsOpen(true)}>
                Open Modal
            </button>
            <Modal isOpen={isOpen} onClose={()=>setIsOpen(false)} >
                <h2>Modal content</h2>
                <p>This content is rendered outside the app component!</p>

            </Modal>
        </div>
    )

}