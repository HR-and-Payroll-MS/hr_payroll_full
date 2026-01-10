import { createContext, useContext, useState ,useEffect } from "react";
import useSystemTheme from "../Hooks/useSystemTheme";
import { getLocalData, setLocalData } from "../Hooks/useLocalStorage";


const themeContext = createContext();

export function ThemeContext({children})

{
    const systemTheme = useSystemTheme();

    const [theme,setTheme]= useState( getLocalData('theme')? getLocalData('theme'):systemTheme
                                        // light: "bg-white shadow dark:bg-slate-700 drop-shadow-2xl",
                                        // dark: "bg-gray-50 dark:bg-slate-900",
                                        );

    const changeTheme = (variable,place="sidebar")=>{
      if(place==='sidebar') setLocalData('theme',variable)
  // console.log(getLocalData('theme'))

    if (variable === 'light') {
      setTheme(
        // light: "bg-white shadow dark:bg-slate-700 drop-shadow-2xl",
        // dark: "bg-gray-50 dark:bg-slate-900",
        variable,
      );
    } else {
      setTheme(
        // dark: "bg-white shadow dark:bg-slate-700 drop-shadow-2xl",
        // light: "bg-gray-50 dark:bg-slate-900",
        "dark"
      );
    }
  }

  
useEffect(()=>{
  // console.log(systemTheme)
  // console.log(getLocalData('theme'))
  if(!getLocalData('theme'))changeTheme(systemTheme,"system")
  // getLocalData('theme')==='system'? changeTheme(systemTheme):changeTheme(getLocalData('theme'))
},[systemTheme])

    return(
        <themeContext.Provider value={{theme, changeTheme}}>
            {children}
        </themeContext.Provider>
    )
}

export const useTheme=()=>{
    return useContext(themeContext);
}
