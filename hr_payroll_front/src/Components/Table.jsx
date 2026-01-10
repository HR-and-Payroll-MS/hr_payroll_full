import React, { useEffect, useRef } from "react";
import { useFormattedTableData } from "../utils/useFormattedTableData";
import { usePagination } from "../Hooks/usePagination";
import { Pagination } from "./Pagination";
import ThreeDots from "../animations/ThreeDots";
import TableStructures from "./TableStructures";
// import { Commet, FourSquare } from "react-loading-indicators";
export default function Table({ Data,pages=5,titleStructure=[], setExportData, Structure, ke, clickable = true, components, title = [], onRowClick, nickname = "view", D1,D2 }) {
  // Pass the full Data array to the hook. It will handle the slicing.
  const { data, page, setPage, totalPages } = usePagination(pages, Data || []);
  const prevDataRef = useRef(null);

  useEffect(() => {
    if (data && JSON.stringify(data) !== JSON.stringify(prevDataRef.current)) {
      if (setExportData) {
        setExportData(data);
        prevDataRef.current = data;
      }
    }
  }, [data, setExportData]);

  const handleRowClick = (rowData, index, rowDataOriginal) => {
    if (onRowClick) {
      onRowClick(rowData, index, rowDataOriginal);
    }
  };

  const bodyStructure = Structure;
  console.log(ke)
  // Format the 10 items currently visible on this page
  const structuredData = useFormattedTableData(data, Structure, ke);

  const table_header = (
    <thead className="bg-slate-100 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 sticky shadow top-0 dark:bg-slate-700 ">
      <tr>
        {title.map((id, i) => (
          <th key={i} className="px-4 py-3 text-left">
            <TableStructures  id={titleStructure[i]||11} item={[id]} />
          </th>
        ))}
      </tr>
    </thead>
  );

  const table_content = structuredData.length > 0 ? (
    <tbody className="h-fit">
      {structuredData.map((i, index) => (
        <tr 
          key={index} 
          {...(clickable && { onClick: () => handleRowClick(i.at(-1), index, data) })} 
          className={`${clickable ? "cursor-pointer" : ""} hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm text-gray-700`}
        >
          {i.map((j, jndex) =>
            jndex !== i.length - 1 && (
              <td key={jndex} className="border-b border-gray-100 dark:border-gray-600 px-4 py-2">
                <TableStructures nickname={nickname} rawData={Data} Comps={components} data={data[index]} D1={D1} id={bodyStructure[jndex]} item={j} />
              </td>
            )
          )}
        </tr>
      ))}
    </tbody>

    //   <tbody>
//   {structuredData.map((i, index) => (
//     <tr key={index} 
// {...(clickable && { onClick: () => handleRowClick(i.at(-1), index,data),})} className={`${clickable ? "cursor-pointer" : ""} hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm text-gray-700 `}>
//       {/* {console.log("Row data for click:",i)} */}
//       {i.map((j, jndex) =>
//         jndex !== i.length - 1 && (
//           <td key={jndex} className="border-b border-gray-100 dark:border-gray-600 px-4 py-2">
//             <TableStructures nickname={nickname} rawData={Data} Comps={components} data={data[index]} D1={D1} id={bodyStructure[jndex]} item={j} />
//           </td>
//         )
//       )}
//     </tr>
//   ))}
// </tbody>
  ) : (
    <tbody>
      <tr>
        <td colSpan={title.length} className="text-center text-gray-500 py-4 ">
          <div className="flex flex-col font-semibold opacity-40 justify-center items-center">
            <img src="/public/pic/F1.png" alt="no users found" />
            No Data
          </div>
        </td>
      </tr>
    </tbody>
  );

  return (
    <div className="flex-1 flex overflow-hidden flex-col h-full">
      <div className="flex-1 overflow-y-scroll h-full  scrollbar-hidden">
        <table className="bg-white dark:bg-slate-800 border-gray-300 w-full">
          {table_header}
          {table_content}
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}











































// import React, { useEffect, useRef } from "react";
// import { useFormattedTableData } from "../utils/useFormattedTableData";
// import { usePagination } from "../Hooks/usePagination";
// import { Pagination } from "./Pagination";
// import ThreeDots from "../animations/ThreeDots";
// import TableStructures from "./TableStructures";
// import { Commet, FourSquare } from "react-loading-indicators";
// function Table({ Data,URL,onRowClickInside,setExportData, Structure, ke,clickable=true,components ,title=[], onRowClick,totPage=1,nickname="view",D1}) {
//   const { data, page,setPage, totalPages, loading } = usePagination(URL,10,Data?Data:[],totPage)
//   const prevDataRef = useRef(null);

//   useEffect(() => {
//     // Check if data exists AND if it is different from what we last sent
//     // We use JSON.stringify for a deep comparison to avoid reference issues
//     if (data && JSON.stringify(data) !== JSON.stringify(prevDataRef.current)) {
//       if (setExportData) {
//         setExportData(data);
//         prevDataRef.current = data; // Update the ref
//       }
//     }
//   }, [data, setExportData]);
//   const handleRowClick = (rowData,index,data) => {
//     if (onRowClick) {
//       onRowClick(rowData,index,data)
//       // onRowClick(rowData,index)
//     } else if(rowData.id){
//     }
//   }
//   const bodyStructure = Structure;
//   const table_header = (
//       <thead className="bg-slate-100 sticky top-0 dark:bg-slate-700 rounded-xl">
//          <tr>
//            {title.map((id, i) => (
//             <th key={i} className="px-4 py-3 text-left">
//                {/* {tableStructure(11,[id])} */}
//                <TableStructures id={11} item={[id]}/>
//              </th>
//           ))}
//         </tr>
//       </thead>
//     );












//   const structuredData = useFormattedTableData(data, Structure, ke);





//  const table_content = loading ? (
//   <tbody>
//     <tr>
//       <td colSpan={9} className="text-center py-4">
        
//               <div className="flex opacity-50 justify-center items-center h-64">
//                 {/* <ThreeDots /> */}
//                 <Commet color={"oklch(62.7% 0.194 149.214)"} size="medium" text="loading" textColor=""/>
//               </div>
//       </td>
//     </tr>
//   </tbody>

// ) : structuredData.length > 0 ? (
//   <tbody>
//   {structuredData.map((i, index) => (
//     <tr key={index} {...(clickable && { onClick: () => handleRowClick(i.at(-1), index,data),})} className={`${clickable ? "cursor-pointer" : ""} hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm text-gray-700 `}>
//       {/* {console.log("Row data for click:",i)} */}
//       {i.map((j, jndex) =>
//         jndex !== i.length - 1 && (
//           <td key={jndex} className="border-b border-gray-100 dark:border-gray-600 px-4 py-2">
//             <TableStructures nickname={nickname} rawData={Data} Comps={components} data={data[index]} D1={D1} id={bodyStructure[jndex]} item={j} />
//           </td>
//         )
//       )}
//     </tr>
//   ))}
// </tbody>






// ) : (
//   <tbody>
//     <tr>
//       <td colSpan={9} className="text-center text-gray-500 py-4 ">
//         <div className="flex flex-col font-semibold opacity-40 justify-center items-center">
//           <img className=" " src="/public/pic/F1.png" alt="no users found" />No Data</div>
//       </td>
//     </tr>
//   </tbody>
// );
//   return (
//     <div className="flex-1 flex flex-col overflow-y-scroll scrollbar-hidden overflow-hidden">
//       <table className="bg-white  dark:bg-slate-800  border-gray-300 w-full">
//         {table_header}
//         {table_content}
//       </table> 
//       <Pagination page = {page} totalPages = {totalPages} onPageChange={setPage}/> 
//     </div>
//   );
// }
// export default Table;

































  

    // <tr key={index} {...(clickable && { onClick: () => handleRowClick(i,index),})} className={`${clickable ? "cursor-pointer" : ""} hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm text-gray-700 `}>
    //   {i.map((j, jndex) =>
    //     jndex !== i.length - 1 && (
    //       <td key={jndex}  className="border-b border-gray-100 dark:border-gray-600 px-4 py-2">
    //         <TableStructures nickname={nickname} rawData={Data} Comps={components} data={data[index]} D1={D1} id={bodyStructure[jndex]} item={j} />
    //       </td>
    //     )
    //   )}
    // </tr>