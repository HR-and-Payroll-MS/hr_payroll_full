// import React, { useEffect, useState } from 'react'

// export default function useFetch(url){
//     const [data, setData]= useState(null);
//     const [loading, setLoading] =useState(true);
//     const [error, setError]= useState(null);

//     useEffect(()=>{
//         const fetchData=async()=>{
//             try{
//                 const res=await axios.get(url);
//                 setData(res.data);
//             } catch(err){
//                 setError(err);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchData();
//     },[url]);

//   return {data,loading,error}
// }









// to use this hook later on the code
// first import useFetch from ".../hooks/useFetch"
// then split it i mean like this . . . const {data , loading , error } = useFetch ("https://jsonplaceholder.typicode.com/users");
// if (loading) return <p> Loading ..... </p>;
// if (error) return <p> Error loading users </p>;

// return (
    // <div>
        // <h1> User List </h1>
        // {data.map(user=>(
            // <p key={user.id}>{user.name}</P>
            // ))}
    // </div>
// )

