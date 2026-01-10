import React, { useState } from 'react'

function useForm(initialValues={},onSubmit) {
    const [values, setValues] = useState(initialValues);
    const handleChange =(e)=>{
        const {name, value}= e.target;
        setValues((prev)=>({...prev,[name]:value,}))
    }

    const handleSubmit =(e)=>{
        e.preventDefault();
        if (onSubmit) onSubmit(values)
    }

  return { values, handleChange, handleSubmit };
}

export default useForm




//using it later
/*
    const {values, handleChange, handleSubmit} = useForm({email:"",Password:""},(data)=>{console.log("form submiteted:", data);});

    return {
    <form onSubmit={handleSubmit}>
        <input 
            name = "email"
            value= {values.email}
            onChange = {handleChange}
            placeholder= "Email" />

    </form>
    }
*/