import multer from "multer";
import path from "path";
import fs from "fs";
import { customAlphabet } from "nanoid";

// Define the storage destination for raw uploads
const rawUploadsDir = "./media/raw";

// Ensure the upload directory exists
fs.mkdirSync(rawUploadsDir, { recursive: true });

// Configure how files are stored
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, rawUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename to prevent conflicts
    const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);
    const uniqueSuffix = Date.now() + "-" + nanoid();
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

// Filter for allowed image types
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};

// Filter for allowed video types
const videoFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Not a video! Please upload only videos."), false);
  }
};

export const uploadImage = multer({
  storage: storage,
  fileFilter: imageFileFilter,
});
export const uploadVideo = multer({
  storage: storage,
  fileFilter: videoFileFilter,
});
