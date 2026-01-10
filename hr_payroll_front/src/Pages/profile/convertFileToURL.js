import { createImage, getCroppedImage } from "cropper-image-utils";
// or another lib — works well with easy-crop
export default async function cropImage(file, crop, zoom){
  return await getCroppedImage(file,{crop,zoom});
}
