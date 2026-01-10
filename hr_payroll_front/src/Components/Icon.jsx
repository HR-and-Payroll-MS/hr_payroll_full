import * as Icons from "lucide-react"

export default function Icon({name,...props}){
    const Ic=Icons[name];
    if(!Ic) return <span>?</span>
    return <Ic {...props} />
}