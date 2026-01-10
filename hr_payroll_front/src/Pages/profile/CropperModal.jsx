import { useState } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "./getCroppedImg";

export default function CropperModal({ file, onSave }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      // We send the original file URL and the calculated PIXELS
      const croppedImage = await getCroppedImg(file, croppedAreaPixels);
      onSave(croppedImage);
    } catch (e) {
      console.error("Error cropping image:", e);
    }
  };

  return (
    <div className="mt-4">
      <div className="relative w-full h-64 bg-black/80 rounded-md overflow-hidden">
        <Cropper
          image={file}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          // The second argument 'pixels' is the key to accuracy
          onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          cropShape="round"
          showGrid={false}
        />
      </div>

      <div className="mt-4 px-2">
        <label className="text-xs text-gray-500 block mb-1">Zoom</label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      <button
        onClick={handleSave}
        className="btn btn-primary w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition-colors"
      >
        Apply Crop
      </button>
    </div>
  );
}