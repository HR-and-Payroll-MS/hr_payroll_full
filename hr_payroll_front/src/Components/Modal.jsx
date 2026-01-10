import React from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '../Context/ThemeContext';
function Modal({children ,isOpen,location="left",className="",transparency=""}) 
{   
   const {theme} = useTheme();
   const Location=location==="left"?"justify-start":location==="right"?"justify-end":"justify-center";
   if(!isOpen) return null; 
    return createPortal (
        <div className= {`${theme} bg-slate-950/35  dark:bg-slate-950/75 flex z-50 w-screen h-screen ${Location} ${className} items-center  absolute top-0     `}>
            {children}
        </div>,document.body
    )
}

export default Modal