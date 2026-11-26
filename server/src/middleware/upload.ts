import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { config } from '../config.js';

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const randomName = crypto.randomUUID();
    cb(null, `${randomName}${ext}`);
  }
});

const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export const uploadImage = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 MB max
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP image formats are supported.'));
    }
  }
});

// Separate storage for body progress photos so they are not exposed by the public /uploads route.
if (!fs.existsSync(config.privateUploadDir)) {
  fs.mkdirSync(config.privateUploadDir, { recursive: true });
}

export const uploadPrivateImage = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, config.privateUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${crypto.randomUUID()}${ext}`);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP image formats are supported.'));
    }
  }
});
