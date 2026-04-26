import express from "express";
import multer from "multer";

import {
  uploadCourses,
  searchCourses,
  getAllCourses
} from "../controllers/courseController.js";

import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

//  Multer setup (store files in uploads/)
const upload = multer({
  dest: "uploads/"
});

// Get all courses (public)
router.get("/", getAllCourses);

//  Upload CSV (Protected - Admin only)
router.post(
  "/upload",
  protect,
  upload.single("file"),
  uploadCourses
);

// Search courses (public)
router.get("/search", searchCourses);

export default router;