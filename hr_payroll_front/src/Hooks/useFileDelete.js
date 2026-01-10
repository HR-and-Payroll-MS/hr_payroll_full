import { useState } from "react";

export function useFileDelete() {
  const [toDelete, setToDelete] = useState([]);

  const markDelete = (index) => {
    setToDelete((prev) => [...prev, index]);
  };

  const cancelDelete = (index) => {
    setToDelete((prev) => prev.filter((i) => i !== index));
  };

  const isMarked = (index) => toDelete.includes(index);

  const resetDelete = () => setToDelete([]);

  return { toDelete, markDelete, cancelDelete, isMarked, resetDelete };
}
