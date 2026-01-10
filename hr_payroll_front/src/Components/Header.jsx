import React from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

function Header({ Title, subTitle, now, prev, children, className ,bg=""}) {
  const navigate = useNavigate();

  // Helper function to render flexible content
  const renderContent = (content, defaultClass) => {
    if (!content) return null;
    // If it's a string, wrap it in a p tag with styles. 
    // If it's an object (JSX), render it as-is.
    return typeof content === 'string' ? (
      <p className={defaultClass}>{content}</p>
    ) : (
      content
    );
  };

  return (
    <div id="left" className={`flex w-full py-2.5 gap-3 ${className} justify-between items-center${bg}`}>
      <div className="flex flex-1 flex-col dark:text-slate-200 text-gray-700 items-start justify-start rounded-md">
        
        {renderContent(Title, "text-xl font-bold")}

        {prev && now && (
          <p className="text-xs flex dark:text-slate-400 text-gray-500 font-semibold items-center">
            <span 
              onClick={() => navigate(-1)} 
              className='hover:text-slate-700 hover:cursor-pointer dark:hover:text-slate-100'
            >
              {prev}
            </span>
            <Icon className="w-4 h-4 mx-1 rotate-180" name="ChevronLeft" /> 
            {now}
          </p>
        )}

        {/* Flexible Subtitle */}
        {renderContent(subTitle, "text-xs flex dark:text-slate-400 text-gray-500 font-semibold")}
      </div>

      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  )
}

export default Header;



// import React from 'react'
// import { useNavigate } from 'react-router-dom'
// import Icon from './Icon'

// function Header({Title,subTitle , now,prev,children,className}) {
//   const navigate = useNavigate();
//   return (<div id="left" className={ `flex w-full py-2.5 gap-3 ${className}  justify-between items-center  `}>
            
            
//             <div className="flex flex-1 flex-col dark:text-slate-200 text-gray-700 items-start  justify-start  rounded-md">
//                     <p className="text-xl font-bold">{Title}</p>
//                     {prev && now && <p className="text-xs flex dark:text-slate-400 text-gray-500 font-semibold"><span onClick={()=> navigate(-1)} className='hover:text-slate-700 hover:cursor-pointer dark:hover:text-slate-100'>{prev}</span><Icon className="w-4 h-4" name="ChevronLeft"/>{now}</p>}
//                     {subTitle && <p className="text-xs flex dark:text-slate-400 text-gray-500 font-semibold">{subTitle}</p>}
//             </div>
//             {children?
//                           //  <div className="flex items-center w-1/3  px-1.5 border dark:text-slate-200 border-gray-200 rounded-md">
//                            <div className="flex items-center gap-3">
//                 {children}
            
//             </div>:""}
//         </div>
//   )
// }

// export default Header