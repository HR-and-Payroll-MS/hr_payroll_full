import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { getLocalData, setLocalData } from '../Hooks/useLocalStorage'

function WelcomeOverlay({Title="No Title",subTitle="No sub title",isOpen, setClose}) {
    
  const setFirstTime=()=>{
    setLocalData("hi","true")
     setClose(false)
  }

  return (
    <Modal transparency='bg-slate-800/50 dark:bg-slate-950/75' isOpen={isOpen} location={'center'}>
        {/* transform -translate-x-full transition-transform duration-300 ease-in-out */}
        <div className="  text-center gap-3.5 justify-center dark:shadow-2xl dark:inset-shadow-2xs dark:inset-shadow-slate-700 shadow-2xl inset-shadow-2xs inset-shadow-white  items-center rounded h-fit  lg:w-3/12  sm:w-3/5 md:w-5/12 px-6 pb-6 dark:bg-slate-800 dark:text-slate-300 bg-amber-50 flex flex-col">
          <div className="flex-1 flex gap-1 flex-col p-2  ">
            <img
              className="flex-1 m-1.5 max-h-28 object-cover"
              src="\pic\F5.png"
              alt="F5"
            />
            <p className="font-bold text-3xl ">{Title}</p>
            <p className="font-semibold text-wrap dark:text-slate-400 ">
              {subTitle}
            </p>
          </div>
          <button
            className="bg-slate-800 dark:bg-green-800 cursor-pointer w-full text-slate-100 py-1 rounded"
            onClick={() =>setFirstTime()}
          >
            Let's Go
          </button>
        </div>
      </Modal>
  )
}

export default WelcomeOverlay

// not working check why?