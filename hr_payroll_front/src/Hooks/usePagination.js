import { useState, useMemo } from "react";

export const usePagination = (limit = 10, fullData = []) => {
    const [page, setPage] = useState(1);

    // Calculate total pages based on the full data length
    const totalPages = Math.max(1, Math.ceil(fullData.length / limit));

    // Slice the data locally so it only shows 10 items at a time
    // We use useMemo so it only recalculates if page or data changes
    const paginatedData = useMemo(() => {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        return fullData.slice(startIndex, endIndex);
    }, [fullData, page, limit]);

    // Ensure the user isn't on a page that no longer exists (e.g., after filtering)
    if (page > totalPages && totalPages > 0) {
        setPage(totalPages);
    }

    return { 
        data: paginatedData, 
        page, 
        setPage, 
        totalPages, 
        loading: false // No loading state needed for local slicing
    };
};






























// import { useEffect, useState } from "react"
// import useAuth from "../Context/AuthContext";

// export const usePagination = (url, limit=10,exdata,totPag) =>{
//     const [data, setData] = useState([]);
//     const {axiosPrivate} = useAuth()
//     const [page, setPage] = useState(1);
//     const [totalPages, setTotalPages] = useState(1)
//     const [loading, setLoading] = useState(false);
//     useEffect(()=>{
//         const fetchData = async () => {
//             setLoading(true);
//             try{
//                 setTotalPages(totPag)
//                 if(url){
//                 const res = await axiosPrivate.get(url)
//                 setData(res.data.results)
//                 }
//                 else{
//                 setData(exdata)}
//             } catch (err) {
//                 console.error(err)
//             } finally {
//                 setLoading(false)
//             }
//         }
//             fetchData()
//     },[url,page,exdata,limit])
// return {data, page, setPage, totalPages, loading}
// }