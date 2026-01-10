import { useEffect, useRef, useState } from "react"

export default function useDropdown(initialValue = null){
    const [selected, setSelected] = useState(initialValue)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null);

    const toggleDropdown = () => setIsOpen((prev)=>!prev);
    const closeDropdown = () => setIsOpen(false);
    const selectItem = (item) =>{
        setSelected(item);
        closeDropdown();
    }

    useEffect(()=>{
        const handleClickOutside =(e)=>{
            if(dropdownRef.current && !dropdownRef.current.contains(e.target)){
                closeDropdown();
            };
        }
            document.addEventListener("mousedown",handleClickOutside);
            return ()=>document.removeEventListener("mousedown",handleClickOutside);
    },[]);

    return {
        selected,
        isOpen,
        dropdownRef,
        toggleDropdown,
        selectItem,
    };
}