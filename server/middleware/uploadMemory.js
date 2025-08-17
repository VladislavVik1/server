// src/middleware/uploadMemory.js
import multer from "multer";
import path from "path";

function imageFileFilter(req, file, cb) {
  const okMime = file.mimetype?.startsWith("image/");
  const ext = path.extname(file.originalname || "").toLowerCase();
  const okExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"].includes(ext);
  if (okMime && okExt) cb(null, true);
  else cb(new Error("Only images are allowed"));
}

export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, 
    files: 4,                  
  },
  fileFilter: imageFileFilter,
});
