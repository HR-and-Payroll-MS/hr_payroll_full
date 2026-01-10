import { useRef, useState } from "react";
import validateImage from "./validateImage";

export function useImageUpload() {
  const [selectedImage, setSelectedImage] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!validateImage(file)) return alert("Invalid Image");

    const url = URL.createObjectURL(file); // preview URL
    setSelectedImage(url);
  };

  return { handleFile, inputRef, selectedImage, setSelectedImage };
}
