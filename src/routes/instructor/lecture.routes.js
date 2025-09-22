import { Router } from "express";
import {
  createLecture,
  getLecturesBySection,
  getDeletedLectures,
  updateLecture,
  deleteLecture,
  restoreLecture,
  uploadLectureVideo,
} from "../../controllers/instructor/lecture.controller.js";
import {
  isAuthenticated,
  hasRole,
} from "../../shared/middleware/auth.middleware.js";
import { uploadVideo } from "../../shared/middleware/upload.middleware.js";

const router = Router();
const instructorAuth = [isAuthenticated, hasRole("instructor")];

// CREATE: Add a new lecture to a specific section
router.post("/sections/:sectionId/lectures", instructorAuth, createLecture);

// READ: Get all active lectures for a specific section
router.get(
  "/sections/:sectionId/lectures",
  instructorAuth,
  getLecturesBySection
);

// READ: Get soft-deleted lectures for a section
router.get(
  "/sections/:sectionId/lectures/deleted",
  instructorAuth,
  getDeletedLectures
);

// UPDATE: Update a specific lecture's details (title, description, etc.)
router.patch("/lectures/:lectureId", instructorAuth, updateLecture);

// DELETE: Soft-delete a specific lecture
router.delete("/lectures/:lectureId", instructorAuth, deleteLecture);

// RESTORE: Restore a soft-deleted lecture
router.patch("/lectures/:lectureId/restore", instructorAuth, restoreLecture);

// UPLOAD: Add or replace the video for a specific lecture
router.post(
  "/lectures/:lectureId/video",
  instructorAuth,
  uploadVideo.single("video"), // From upload.middleware.js
  uploadLectureVideo
);

export default router;
