import Icon from "./Icon";

export default function Button({ icon, onClick, size = 4, className = "",text="Submit" }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 bg-slate-800 text-xs text-slate-100 cursor-pointer rounded-md hover:bg-slate-900 gap-1.5 flex items-center justify-center ${className}`}
    >   {text}
      {icon && <Icon name={icon} className={`w-${size}`} />}
    </button>
  );
}
