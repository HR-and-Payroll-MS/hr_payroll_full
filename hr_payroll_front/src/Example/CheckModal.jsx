import React, { useState } from 'react'
import Modal from '../Components/Modal'
function CheckModal() {
    const [isOpen , close]=useState(false)
    const onClose=()=>close(!isOpen)
  return (
    <div>
        <p onClick={onClose}>Click here to open Modal</p>
        <Modal isOpen={isOpen}>
            <div className='p-32 flex w-2/6 justify-center items-center text-center  h-full bg-pink-100'>
                <p onClick={()=>close(false)} >
                    close this modal      
                </p>
            </div>
            
        </Modal>
    </div>
  )
}

export default CheckModal