import React from 'react'

function ThemeAnimation() {
  return (
    <div className='h-screen w-screen flex justify-center items-center dark:bg-gray-800'>
        <button onClick={()=> document.body.classList.toggle('dark')()} className='h-12 w-12 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700' >
            {/* icon for some dark or light  className=" fill-violet-700 block dark:hidden"*/}
            {/* Another icon for some dark or light className=" fill-yellow-500 hidden dark:block "*/}
        </button>

    </div>
  )
}

export default ThemeAnimation