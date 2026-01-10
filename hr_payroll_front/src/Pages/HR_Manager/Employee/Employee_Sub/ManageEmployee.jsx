import Header from "../../../../Components/Header"

export default function ManageEmployee(){
    const fruit=[1,2,3,4,5,6,7,8,9]
    
           
            
           

    const table_header=<thead className={`bg-slate-100 dark:bg-slate-700  rounded-xl`}>
            <tr className="justify-evenly  ">
                
                <th className=" px-4 py-3">
                    <div className="flex w-full justify-between items-center ">
                        <div className="flex gap-1.5">
                            <input className="" type="checkbox" name="remember me" id="rememberme" />
                            <p className={`font-semibold text-gray-500  text-xs  dark:text-slate-200`}>Employee Name</p>
                        </div>    
                            <img className="h-5 opacity-25" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
                    </div>
                </th>
                <th className=" px-4 py-3">
                    <div className="flex w-full justify-between items-center ">
                            <p className={`font-semibold text-gray-500  text-xs  dark:text-slate-300`}>Job Title</p>
                            <img className="h-5 opacity-25" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
                    </div>
                </th>
                <th className=" px-4 py-3">
                    <div className="flex w-full justify-between items-center ">
                            <p className={`font-semibold text-gray-500  text-xs  dark:text-slate-300`}>Line Manager</p>
                            <img className="h-5 opacity-25" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
                    </div>
                </th>
                <th className=" px-4 py-3">
                    <div className="flex w-full justify-between items-center ">
                            <p className={`font-semibold text-gray-500  text-xs  dark:text-slate-300`}>Department</p>
                            <img className="h-5 opacity-25" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
                    </div>
                </th>
                <th className=" px-4 py-3">
                    <div className="flex w-full justify-between items-center ">
                            <p className={`font-semibold text-gray-500  text- dark:text-slate-300`}>Office</p>
                            <img className="h-5 opacity-25" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
                    </div>
                </th>
                <th className=" px-4 py-3">
                    <div className="flex w-full justify-between items-center ">
                            <p className={`font-semibold text-gray-500  text- dark:text-slate-300`}>Employee Status</p>
                            <img className="h-5 opacity-25" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
                    </div>
                </th>
                <th className=" px-4 py-3">
                    <div className="flex w-full justify-between items-center ">
                            <p className={`font-semibold text-gray-500  text- dark:text-slate-300`}>Account</p>
                            <img className="h-5 opacity-25" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
                    </div>
                </th>
               
            </tr>
        </thead>
    const table_content=<tbody >
            {
                fruit.map(fruit=>
                <tr className={`hover:bg-slate-50   dark:bg-slate-800  font-semibold text-sm dark:text-slate-400 text-gray-700  dark:hover:bg-slate-700`}>
                     <td className="border-b border-gray-100 dark:border-gray-600 dark:text-slate-400 px-4 py-2">
                    <div className="flex  w-full justify-start items-center gap-2 ">
                        <input className="" type="checkbox" name="remember me" id="rememberme" />
                        <img className="h-6 w-6 rounded-full" src="\pic\download (48).png" alt="" />
                        <div className="flex flex-col items-start gap-0 justify-center ">
                            <p className="font-semibold dark:text-slate-200 text-gray-700  text-sm">Pristia Candira</p>
                            <p className="font-normal dark:text-slate-400 text-gray-500  text-xs">et8302tn@gmail.com</p>
                        </div>
                    </div>
                </td>
                    <td className={` dark:border-slate-700  border-b border-gray-100 px-4 py-2 `}>Developer</td>
                    <td className={` dark:border-slate-700  border-b border-gray-100 px-4 py-2 `}>No Name</td>
                    <td className={` dark:border-slate-700  border-b border-gray-100 px-4 py-2 `}>No Department</td>
                    
                    <td className={` dark:border-slate-700  border-b border-gray-100 px-4 py-2`}>No Office</td>
                    <td className={` dark:border-slate-700  border-b border-gray-100 px-4 py-2`}>
                        <div className="flex w-full justify-between items-center px-6 text-center">
                                <p className="font-semibold bg-green-100 flex-1 py-0.5 rounded ">Active</p>
                                <img className="h-4 opacity-25" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
                        </div>
                    </td>
                    <td className={` dark:border-slate-700  border-b border-gray-100 px-4 py-2`}>Deactivated</td>
                    <td className={` dark:border-slate-700  border-b border-gray-100 px-4 py-2`}>
                        <div className="flex w-full justify-center gap-1.5 items-center ">
                                <div className="p-1.5 bg-blue-800 rounded-md">
                                    <img className="h-4 opacity-25" src="\svg\date-2-svgrepo-com.svg" alt="" />
                                </div>
                                <div className="p-1.5 bg-red-800 rounded-md">
                                    <img className="h-4 opacity-25" src="\svg\date-2-svgrepo-com.svg" alt="" />
                                </div>
                        </div>
                    </td>
                </tr>)
            }
            
        </tbody>
    const left= <div id="left" className="flex py-2.5 flex-2 gap-3  justify-between items-center  ">
            
             <div className="flex  flex-1 items-center rounded border border-slate-200 justify-between px-2.5 py-2 h-full">
                    <input className=" h-full  rounded w-full" type="email" name="email" id="email" placeholder="search what you need" />
                    <img className="h-4 opacity-45" src="\svg\search-svgrepo-com.svg" alt="" />
                </div>
            <div className="flex  text-gray-700 border border-gray-100 items-center  justify-between gap-1.5 px-5 py-2.5 rounded-md">
                    <p className="text-xs font-semibold">All Office</p>
                    <img className="h-4" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
            </div>
            <div className="flex  text-gray-700 border border-gray-100 items-center  justify-between gap-1.5 px-5 py-2.5 rounded-md">
                    <p className="text-xs font-semibold">All Job Titles</p>
                    <img className="h-4" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
            </div>
            <div className="flex  text-gray-700 border border-gray-100 items-center  justify-between gap-1.5 px-5 py-2.5 rounded-md">
                    <p className="text-xs font-semibold">All Status</p>
                    <img className="h-4" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
            </div>
           

        </div>
    const pagination=<div id="middle" className="flex flex-1 justify-between  items-start ">
                
                <div className="flex items-center  gap-1.5">
                    <div className={` dark:border-slate-700 py-1.5 px-1 border-gray-100 shadow-2xl border h-full`}>
                        <img className="h-3" src="\svg\left-chevron-svgrepo-com.svg" alt="" />
                    </div>
                    <p className={`  dark:border-slate-700 dark:text-slate-300 font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-500  text-xs`}>1</p>
                    <p className={`  dark:border-slate-700 dark:text-slate-300 font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-500  text-xs items-center`}>...</p>
                    <p className={`  dark:border-slate-700 dark:text-slate-300 font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-700  text-xs`}>2</p>
                    <div className={`  dark:border-slate-700 dark:text-slate-300 py-1.5 px-1 border-gray-100 shadow-2xl border h-full`}> 
                        <img className="h-3 rotate-180" src="\svg\left-chevron-svgrepo-com.svg" alt="" />
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <p className={` dark:text-slate-300 font-semibold text-gray-500  text-xs`}>Showing 1 to 8 of 8 entries</p>
                    <div className={` dark:border-slate-700 flex items-center py-1.5 px-2 border border-gray-100 rounded`}>
                        <p className={` dark:text-slate-300 font-semibold text-gray-700  text-xs`}>Show 8</p>
                        <img className="h-4 rotate-180" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
                    </div>
                </div>
        </div>
    return <div className="flex flex-col gap-6 p-4 shadow  rounded-md h-full">
                
            <div className={`bg-white flex-col  dark:bg-slate-800 flex justify-evenly h-fit  `}> 
                 <Header Title={"My Attendance"} Breadcrumb={"Manage your Attendance"}> 
                    <div className={`flex border  text-slate-700 items-center  justify-center gap-1.5 px-5 py-2.5 rounded-md`}>
                            <img className="h-4" src="\svg\clock.svg" alt="" />
                            <p className="text-xs font-semibold">Download</p>
                    </div>
                    <div className={`flex bg-slate-800 text-white items-center  justify-center gap-1.5 px-5 py-3 rounded-md`}>
                            <img className="h-4" src="\svg\clock.svg" alt="" />
                            <p className="text-xs font-semibold">Add new</p>
                    </div>
                </Header>
                {left}
            </div>
            <div className="flex-1 flex flex-col overflow-y-scroll scrollbar-hidden overflow-hidden">
                <table className={`  bg-white  dark:bg-slate-300 border-b border-gray-300 `}>
                    {table_header}{table_content}</table>
                
                
            </div>
            <div className={`bg-white flex justify-evenly h-16 gap-3  dark:bg-slate-800 `}> 
                {pagination}
            </div>
    </div>
}