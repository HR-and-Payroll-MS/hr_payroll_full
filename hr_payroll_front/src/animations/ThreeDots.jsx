import React from 'react'

export default function ThreeDots() {
  return (
    <div className="flex justify-center items-center h-fill">
<div className="flex flex-row gap-1">
  <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce"></div>
  <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce [animation-delay:-.3s]"></div>
  <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce [animation-delay:-.5s]"></div>
</div>
</div>
  )
}
