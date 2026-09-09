import { MAX_IMAGE_BYTES } from "./constants";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error("Image exceeds the 5 MB limit."));
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error("Please upload a PNG, JPG, WEBP, or GIF image."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.readAsDataURL(file);
  });
}

export function isImageFile(file: File | undefined | null): file is File {
  return !!file && file.type.startsWith("image/");
}
