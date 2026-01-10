import React from 'react'
import { useNavigate } from 'react-router-dom'

function NotFound() {
  const navigate = useNavigate();
  return (
    // <div className='flex w-full h-screen justify-center text-amber-200 dark:bg-slate-800 items-center text-9xl text-shadow-md text-shadow-amber-600 font-extrabold'>NotFound</div>
    <div className='h-screen w-screen dark:bg-slate-800 p-36'>
      <img src='/public/pic/pngwing.png' className='h-full  w-full'/>
      <button className='px-4 py-2 bg-slate-900 rounded dark:text-slate-800 dark:bg-slate-200 text-slate-200 hover:cursor-pointer' 
        onClick={()=>navigate(-1)}> Go Back</button>
    </div>
  )
}

export default NotFound