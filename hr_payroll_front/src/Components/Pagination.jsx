import React from 'react'
import Icon from './Icon'


// export const Pagination = ({ page, totalPages, onPageChange }) => {
//   const pages = [...Array(totalPages)].map((_, i) => i + 1);

//   return (totalPages>1 &&
//     <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
//                     <button onClick={()=>onPageChange(page - 1)} disabled={page === 1} className={` dark:border-slate-700 py-1.5 dark:hover:bg-slate-600 hover:bg-slate-200 px-1 border-gray-100 shadow-2xl border h-full`}>
//                          <Icon name={"ChevronLeft"} className="w-4 h-4 text-slate-700 dark:text-slate-300"/>
//                      </button>





//       {pages.slice(Math.max(page - 2, 0), page + 1).map((p) => (
//         <button
//           key={p}
//           onClick={() => onPageChange(p)}
//            className={`${p === page ? 'bg-slate-700 dark:bg-slate-600 dark:text-slate-200 text-white':'hover:bg-slate-300 dark:hover:bg-slate-600'}  dark:border-slate-700 dark:text-slate-300 font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-500  text-xs items-center`}>
//                                  {p}
//         </button>
//       ))}

//       {page < totalPages - 2 && <span className="text-gray-500">...</span>}

//       {page !== totalPages && (
//         <button
//           onClick={() => onPageChange(totalPages)}
//           className=" dark:border-slate-700 dark:text-slate-300 font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-500  text-xs items-center"
//         >
//           {totalPages}
//         </button>
//       )}





//                     <button onClick={()=>onPageChange(page + 1)} disabled={page === totalPages}  className={` dark:hover:bg-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 py-1.5 px-1 border-gray-100 shadow-2xl border h-full`}> 
//                         <Icon name={"ChevronRight"} className="w-4 h-4 text-slate-700 dark:text-slate-300"/>
//                     </button>
//     </div>
//   );
// };




// ............................       Working Pagination         ......................................
export const Pagination=({ page, totalPages=1, onPageChange})=> {
  return (totalPages>1 &&
    <div id="middle" className="flex  justify-between p-2 items-center ">
                
                <div className="flex items-center  gap-1.5">
                    <button onClick={()=>onPageChange(page - 1)} disabled={page === 1} className={` dark:border-slate-700 py-1.5 dark:hover:bg-slate-600 hover:bg-slate-200 px-1 border-gray-100 shadow-2xl border h-full`}>
                        <Icon name={"ChevronLeft"} className="w-4 h-4 text-slate-700 dark:text-slate-300"/>
                    </button>








                    {
                        [...Array(totalPages)].map((_, i)=>(

                            <button
                                key={i}
                                className={`${i + 1 === page ? 'bg-slate-700 dark:bg-slate-600 dark:text-slate-200 text-white':'hover:bg-slate-300 dark:hover:bg-slate-600'}  dark:border-slate-700 dark:text-slate-300 font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-500  text-xs items-center`}
                                onClick={()=>onPageChange(i + 1)}
                                >
                                    {i + 1}
                            </button>

                        ))
                    }

                    





                    <button onClick={()=>onPageChange(page + 1)} disabled={page === totalPages}  className={` dark:hover:bg-slate-600  hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 py-1.5 px-1 border-gray-100 shadow hover:inset-shadow-xs shadow-slate-200 border h-full`}> 
                        <Icon name={"ChevronRight"} className="w-4 h-4 text-slate-700 dark:text-slate-300"/>
                    </button>
                </div>







                <div className="flex items-center gap-1.5">
                    <p className={` dark:text-slate-300 font-semibold text-gray-500  text-xs`}>Total Page entries {totalPages}</p>
                    {/* <button className={` dark:border-slate-700 flex items-center py-1.5 px-2 border border-gray-100 rounded`}>
                        <p className={` dark:text-slate-300 font-semibold text-gray-700  text-xs`}>Show 8</p>
                        <Icon name={"ChevronUp"} className="w-4 h-4 text-slate-700 dark:text-slate-300"/>
                    </button> */}
                </div>
        </div>
  )
}




/* 
    ........................... using inside component ..................................

    import {usePagination} from 'the path'
    const { data:users, page,setPage, totalPages, loading } = usePagination("/api/users",10)

    return (

        <div>
            {
                loading ? 
                    (loading animation):
                    (
                        <table>
                            <thead>
                                .....
                            <thead>
                            <tbody>
                                {users.map((u)=>(
                                        <tr key = u.id>.....{u.name}</tr>
                                    ))}
                            </tbody>
                        </table>
                    )
            }
            <Pagination page = {page} totalPages = {totalPages} onPageChange={setPage}/>
        </div>
    
    )

*/