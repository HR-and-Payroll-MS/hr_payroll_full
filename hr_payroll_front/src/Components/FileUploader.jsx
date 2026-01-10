import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import FileDrawer from "./FileDrawer";
import PDFViewer from "./PDFViewer";

export default function FileUploader({
  onFileSelect,
  label = "Upload File",
  className = "flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
  children,
  data,
  btnBackground = "bg-slate-950 text-slate-100 ",
  IconName = "FileText",
  buttonOnly = false, // ← New prop
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    console.log(data);
    setSelectedFile(Array.isArray(data?.files) ? data?.files[0] : data?.files);
  }, [data]);

  const fileInputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Fixed: renamed closeModal → setIsModalOpen

  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  // Only enable drag events when buttonOnly is false
  const handleDragOver = (e) => {
    if (buttonOnly) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    if (buttonOnly) return;
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    if (buttonOnly) return;
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleChangeFile = (e) => {
    e.stopPropagation();
    handleClick();
  };

  // When buttonOnly is true, we don't want the outer div to act as a drop zone or clickable area
  const outerClass = buttonOnly
    ? className.replace(/cursor-pointer/g, "") // Remove cursor-pointer if present
    : `${className} ${isDragging ? "border-2 border-dashed border-green-600 bg-green-50" : ""}`;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl p-4 ${outerClass}`}
      // Only make the whole area clickable if NOT buttonOnly and no file selected
      onClick={!buttonOnly && !selectedFile && !children ? handleClick : undefined}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=""
      />

      {!selectedFile && (
        <>
          {/* Render children only when not in buttonOnly mode */}
          {!buttonOnly && children ? (
            <>
              {children}
              <div
                onClick={handleClick}
                className={`flex hover:cursor-pointer items-center p-2.5 m-2 rounded-lg ${btnBackground}`}
              >
                <Icon name="FileText" className="h-4" />
                <p className="text-sm text-center px-2">{label}</p>
              </div>
            </>
          ) : (
            /* Always show the internal button (this is the only way to upload in buttonOnly mode) */
            <div
              onClick={handleClick}
              className={`flex hover:cursor-pointer items-center p-2.5 m-2 rounded-lg ${btnBackground}`}
            >
              <Icon name={IconName} className="h-4" />
              <p className="text-sm text-center px-2">{label}</p>
            </div>
          )}
        </>
      )}

      {selectedFile && (
        <div className="w-full flex items-center justify-between mt-2 dark:bg-slate-700 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          <div
            onClick={() => setIsModalOpen(true)}
            className="flex group items-center space-x-2"
          >
            <Icon
              name={IconName}
              className="text-red-600 group-hover:text-green-700 h-5 w-5 flex-shrink-0"
            />
            <div className="flext hover:cursor-pointer group flex-col">
              <p className="text-sm group-hover:text-green-700 font-medium text-gray-800">
                {selectedFile.name}
              </p>
              <p className="text-xs group-hover:text-green-700 text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          {isModalOpen && (
            <FileDrawer isModalOpen={isModalOpen} closeModal={setIsModalOpen}>
              <PDFViewer file={selectedFile} />
            </FileDrawer>
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleChangeFile}
              className={`p-1.5 bg-blue-50 hover:bg-blue-100 rounded-full text-blue-600 transition`}
              title="Change file"
            >
              <Icon name="RefreshCw" className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 bg-red-50 hover:bg-red-100 rounded-full text-red-600 transition"
              title="Remove file"
            >
              <Icon name="Trash2" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}