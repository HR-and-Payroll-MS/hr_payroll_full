// cropUtils.js or inside useImageCropper.js

// 1. Helper to create an HTML Image element from the source url
export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); 
    image.src = url;
  });

// 2. The Main Logic
export default async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // set canvas size to match the cropped area size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the specific slice of the image onto the canvas
  // ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  ctx.drawImage(
    image,
    pixelCrop.x,      // Start X on original image
    pixelCrop.y,      // Start Y on original image
    pixelCrop.width,  // Width to take from original
    pixelCrop.height, // Height to take from original
    0,                // Start X on canvas (0)
    0,                // Start Y on canvas (0)
    pixelCrop.width,  // Draw width on canvas
    pixelCrop.height  // Draw height on canvas
  );

  // Return as Base64 string
  return canvas.toDataURL("image/jpeg");
}