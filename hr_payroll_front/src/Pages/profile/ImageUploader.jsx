import CropperModal from "./CropperModal";
import { useImageUpload } from "./useImageUpload";

export default function ImageUploader({ setImage, onClose }) {
  const { handleFile, inputRef, selectedImage } = useImageUpload();

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Profile Picture</h2>
        
        {/* Only show upload box if no image is selected yet */}
        {!selectedImage ? (
          <div 
            onClick={() => inputRef.current.click()} 
            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            <p className="text-gray-500 font-medium">Click to upload photo</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF</p>
            <input 
              ref={inputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFile} 
            />
          </div>
        ) : (
          /* Show Cropper if image is selected */
          <CropperModal
            file={selectedImage}
            onSave={(output) => {
              setImage(output);
              onClose();
            }}
          />
        )}

        <button 
          className="mt-4 w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2" 
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}