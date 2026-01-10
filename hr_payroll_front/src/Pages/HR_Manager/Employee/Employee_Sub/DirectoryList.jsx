import { NavLink, Outlet } from "react-router-dom"

export const DirectoryList = () => {

              const fruit=[1,2,3,4,5,6,7,8,9,10,3,3,3,3,3,4]
    const pagination=<div id="middle" className="flex flex-1 justify-between  items-start ">
                
                <div className="flex items-center  gap-1.5">
                    <div className="py-1.5 px-1 border-gray-100 shadow-2xl border h-full">
                        <img className="h-3" src="\svg\left-chevron-svgrepo-com.svg" alt="" />
                    </div>
                    <p className="font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-500  text-xs">1</p>
                    <p className="font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-500  text-xs items-center">...</p>
                    <p className="font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-700  text-xs">2</p>
                    <div className="py-1.5 px-1 border-gray-100 shadow-2xl border h-full"> 
                        <img className="h-3 rotate-180" src="\svg\left-chevron-svgrepo-com.svg" alt="" />
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-500  text-xs">Showing 1 to 8 of 8 entries</p>
                    <div className="flex items-center py-1.5 px-2 border border-gray-100 rounded">
                        <p className="font-semibold text-gray-700  text-xs">Show 8</p>
                        <img className="h-4 rotate-180" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
                    </div>
                </div>
        </div>
    const List= <div id="left" className="flex py-2.5 flex-wrap flex-2 gap-5  justify-start items-center  ">
            
            {fruit.map((fruit,i)=>
            <div key={i} className="flex shadow dark:bg-slate-800 bg-white max-w-64  flex-1 flex-col  text-gray-700 border border-gray-100 rounded-xl items-center  justify-start gap-5 px-5 py-4 ">
                    <NavLink to="Detail/General"> <div className="flex flex-col  w-full justify-center gap-2 items-center">
                        <img className="w-12 m-4 h-12 object-fill rounded-full " src="\pic\download (48).png" alt="" />
                        <p className="text-lg font-bold">Angeline Beier</p>
                        <p className="text-md text-gray-500  font-normal">Finance Manager</p>
                    </div>
                    <hr className="text-gray-200 w-full text-shadow-gray-700 text-shadow-2xs" />
                    <div className=" flex flex-col gap-2">
                        <div className="flex justify-center gap-2 items-center ">
                            <img className="h-5 opacity-25" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
                            <p className="font-semibold text-gray-800  text-md">Someemail@gmail.com</p>
                        </div >
                        <div className="flex justify-center gap-2 items-center ">
                                <img className="h-5 opacity-25" src="\svg\phone-svgrepo-com.svg" alt="" />
                                <p className="font-semibold text-gray-800  text-md">0972334145</p>
                        </div>
                    </div></NavLink>
            </div>)}
           
           
            
  
           

        </div>
    const Header= <div id="left" className="flex py-2.5 flex-2 gap-3  justify-between items-center  ">
            
            
            <div className="flex flex-1 flex-col text-gray-700 items-start  justify-start  rounded-md">
                    <p className="text-xl font-bold">Directory</p>
                    <p className="text-xs text-gray-500 font-semibold">This is Director board</p>
            </div>
            {/* <div className="flex bg-slate-800 text-white items-center  justify-center gap-1.5 px-5 py-3 rounded-md">
                    <img className="h-4" src="\svg\clock.svg" alt="" />
                    <p className="text-xs font-semibold">Check in 00h 00m 05s</p>
            </div> */}
            
           
            
            
           

        </div>


                    const DirectoryList =<> {Header}
                            {List}
                    </> 
  return (
    <>{DirectoryList}</>
  )
}
