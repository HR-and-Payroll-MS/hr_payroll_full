export default async function getCroppedImg(imageSrc, pixelCrop) {
  const image = new Image();
  image.src = imageSrc;
  image.setAttribute("crossOrigin", "anonymous"); // Prevents CORS issues
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // The canvas should be exactly the size of the crop area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  ctx.drawImage(
    image,
    pixelCrop.x,       // Start clipping at x
    pixelCrop.y,       // Start clipping at y
    pixelCrop.width,   // Width of clipped area
    pixelCrop.height,  // Height of clipped area
    0,                 // Place at x=0 on canvas
    0,                 // Place at y=0 on canvas
    pixelCrop.width,   // Width of image on canvas
    pixelCrop.height   // Height of image on canvas
  );

  return canvas.toDataURL("image/jpeg");
}