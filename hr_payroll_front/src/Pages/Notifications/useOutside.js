import { useEffect } from "react";

export default function useOutside(ref, onOutside) {
  useEffect(() => {
    function onDown(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      onOutside && onOutside();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, onOutside]);
}
// Hook to detect clicks outside a component (used for closing dropdown/modal like notification panel).