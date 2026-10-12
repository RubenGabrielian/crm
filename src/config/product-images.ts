export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Allowed MIME types and the file extension each is stored with. */
export const PRODUCT_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const PRODUCT_IMAGE_ERRORS = {
  type: "Ընտրեք JPG, PNG կամ WebP նկար",
  size: "Նկարը պետք է լինի մինչև 5 ՄԲ",
};
