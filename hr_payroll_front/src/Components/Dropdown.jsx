import useDropdown from "../Hooks/useDropdown";
import { ChevronDown } from "lucide-react";
import Icon from "./Icon";
import { useState } from "react";

export default function Dropdown({
  text = "",
  border = "border border-gray-300",
  options = [],
  placeholder = "Select...",
  padding="py-2.5",
  onChange,
  Svg,
  width="w-full",
  showIcons = false
}) {
  const { selected, isOpen, dropdownRef, toggleDropdown, selectItem } =
    useDropdown();
  const [icon, setIcon] = useState(Svg || null);

  const handleSelect = (item, svg) => {
    selectItem(item);
    if(showIcons)setIcon(svg);
    if (onChange) onChange(item);
  };

  return (
    <div className={`relative ${width}  ${padding} `} ref={dropdownRef}>
      <button
        type="button" 
        onClick={toggleDropdown}
        className={`w-full ${text} flex text-nowrap text-slate-700 dark:text-slate-200 items-center gap-1 justify-between ${border} rounded-lg px-4 ${padding} hover:border-slate-400 transition`}
      >
        {icon ? <Icon className="w-4 h-4" name={icon} /> : null}
        <span className={`text-slate-700 dark:text-slate-200  ${selected ? "text-gray-900 dark:text-slate-100" : "text-slate-800 dark:text-slate-200"}`}>
          {selected || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
  <ul className="absolute z-10 text-nowrap mt-2 w-full min-w-fit bg-white dark:bg-slate-700 rounded-sm shadow-lg max-h-56 overflow-y-auto hover-bar">
    {options && options.length > 0 ? (
      options.map((item, index) => {
        // normalize item: if it's a string, turn it into an object with content
        const option = typeof item === "string" ? { content: item } : item;

        return (
          <li
            key={index}
            onClick={() => handleSelect(option?.content, option?.svg)}
            className={`px-4 flex gap-1 ${text} text-slate-700 dark:text-slate-200 py-2 cursor-pointer dark:hover:text-slate-800 dark:hover:border-slate-800 hover:bg-slate-100 ${
              selected === option?.content
                ? "bg-slate-100 dark:bg-green-800 dark:text-slate-200 text-slate-600"
                : ""
            }`}
          >
            {option?.svg && <Icon className="w-4 h-4" name={option?.svg} />}
            {option?.content}
          </li>
        );
      })
    ) : (
      <li className="px-4 py-2 text-gray-400">No options</li>
    )}
  </ul>
)}

    </div>
  );
}



/*       how to use
    const viewOptions = 
        [
            {content:'Card View',svg:"Grip"},
            {content:'Tabular View',svg:null}
         ]
      

    const handleselect = (value)=>{
        console.log("selected: ",value)}

        return(
        <div classname="flex justify-center items-center h-screen bg-gray-50">
            <Dropdown showIcons={true} onChange={handleselect} options={viewOptions} text="text-xs  font-semibold" placeholder="Gender"  border="border gap-1 border-gray-100"/>
        </div>
        )
 */