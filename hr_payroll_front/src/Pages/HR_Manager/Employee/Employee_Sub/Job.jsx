import React from 'react'

export const Job = () => {
     const fruit=[1,2]
    const table_header=<thead className="bg-slate-50 rounded-xl w-full">
            <tr className="rounded-2xl *:text-center text-gray-500 text-xs font-normal ">
                
                <th className=" px-4 py-3 rounded-l-2xl">Effective Date</th>
                <th className=" px-4 py-3">Job Title</th>
                <th className=" px-4 py-3">Position Type</th>
                <th className=" px-4 py-3">Employment Type</th>
                <th className=" px-4 py-3 rounded-r-2xl">Line Manager</th>
               
               
            </tr>
        </thead>
    const table_content=<tbody className="w-full">
            {
                fruit.map(fruit=><tr className="hover:bg-slate-50 font-semibold *:text-center text-xs text-gray-700">
                <td className="border-b border-gray-100 px-4 py-2">20 Aug 2023</td>
                <td className="border-b border-gray-100 px-4 py-2 ">Web Dev</td>
                <td className="border-b border-gray-100 px-4 py-2">-</td>
                <td className="border-b border-gray-100 px-4 py-2">full time</td>
                <td className="border-b border-gray-100 px-4 py-2">@skylar</td>
               
            </tr>)
            }
            
        </tbody>
    const employment_info=<div className="border p-2 rounded-lg border-gray-200">
                    <div className="flex mx-4 py-4 border-b border-gray-200">
                        <p className="flex-1 text-xl font-semibold text-gray-700">Address</p>
                        <img className="h-5 opacity-25" src="\svg\fullscreen-exit-alt-svgrepo-com.svg" alt="" />
                    </div>
                   <div id="left" className="flex flex-col gap-5 p-4 justify-start items-start   ">
                            <div className="flex-1 flex gap-2  text-nowrap">
                                <p className="min-w-40 text-gray-400 ">Employee Id</p>
                                <p className="text-gray-700 font-semibold ">UN1203</p>   
                            </div>
                            <div className="flex-1 flex gap-2  text-nowrap">
                                <p className="min-w-40 text-gray-400 ">Service Year</p>
                                <p className="text-gray-700 font-semibold ">3 years 7 months</p>   
                            </div>
                            <div className="flex-1 flex gap-2  text-nowrap">
                                <p className="min-w-40 text-gray-400 ">Join Date</p>
                                <p className="text-gray-700 font-semibold ">20 Aug 2019</p>   
                            </div>
                </div></div> 
    const Job_Timeline=<div className="border p-2 rounded-lg border-gray-200">
                            <div className="flex mx-4 py-4 ">
                                <p className="flex-1 text-xl font-semibold text-gray-700">Job Timeline</p>
                                <img className="h-6 opacity-25" src="\svg\plus_sign_to_represent_add_items.svg" alt="" />
                            </div>
                            <div className="flex px-4">
                                <table className=" flex-1 bg-white border-b border-gray-300 ">
                                    {table_header}
                                    {table_content}
                                </table>
                            </div>
                        </div> 
const Job=<div className="flex flex-col gap-8 scrollbar-hidden overflow-y-scroll">
    {employment_info}
    {Job_Timeline}
    {Job_Timeline}
</div>
    
  return (
    <>{Job}</>
  )
}
