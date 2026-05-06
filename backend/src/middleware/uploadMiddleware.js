import multer from "multer";

// Store files in memory; we'll stream them to Cloudinary
const storage = multer.memoryStorage();

export const uploadSingle = multer({ storage }).single("file");

