// middleware/upload.js
// Handles saving uploaded ID documents and selfies to disk.
//
// PRODUCTION NOTE: For a real launch, don't store these files on the
// server's local disk - use a cloud storage bucket (e.g. AWS S3,
// Cloudflare R2, or a Nepal-hosted equivalent) with private access,
// since these are sensitive identity documents. Swap the `destination`
// logic below for an S3 upload when you're ready; the rest of the app
// only needs the resulting file path/URL.

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, WEBP, or PDF files are allowed.'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per file
});

module.exports = upload;
