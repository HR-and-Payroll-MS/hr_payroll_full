export default function validateImage(file){
  const validTypes = ["image/jpeg","image/png","image/jpg"];
  const maxSize = 2 * 1024 * 1024;

  return file && validTypes.includes(file.type) && file.size <= maxSize;
}
