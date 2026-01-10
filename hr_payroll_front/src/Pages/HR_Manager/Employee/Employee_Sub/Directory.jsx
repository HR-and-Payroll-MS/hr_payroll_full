import { NavLink, Outlet } from "react-router-dom"

export default function Directory(){

    return (
        <div className="bg-gray-50 dark:bg-slate-900 h-full w-full">
            <Outlet/>
        </div>
    )
}