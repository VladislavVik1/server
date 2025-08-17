// server/middleware/uploadDisk.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// => сохраняем в КОРНЕВУЮ папку uploads (на уровень выше server/)
const destDir = path.resolve(__dirname, '..', '..', 'uploads');
fs.mkdirSync(destDir, { recursive: true });

function imageFileFilter(req, file, cb) {
  const okMime = file.mimetype?.startsWith('image/');
  const ext = path.extname(file.originalname || '').toLowerCase();
  const okExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].includes(ext);
  if (okMime && okExt) cb(null, true);
  else cb(new Error('Only images are allowed'));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, destDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
});

export const uploadDisk = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: imageFileFilter,
});
