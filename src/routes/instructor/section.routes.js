import { Router } from "express";
import {
  createSection,
  getSectionsByCourse,
  updateSection,
  deleteSection,
  restoreSection, // <-- Import new controller
  getDeletedSections, // <-- Import new controller
} from "../../controllers/instructor/section.controller.js";
import {
  isAuthenticated,
  hasRole,
} from "../../shared/middleware/auth.middleware.js";

const router = Router();
const instructorAuth = [isAuthenticated, hasRole("instructor")];

// CREATE: Add a new section to a specific course
router.post("/courses/:courseId/sections", instructorAuth, createSection);

// READ: Get all active sections for a specific course
router.get("/courses/:courseId/sections", instructorAuth, getSectionsByCourse);

// READ: Get soft-deleted sections for a course (for a "trash" view)
router.get(
  "/courses/:courseId/sections/deleted",
  instructorAuth,
  getDeletedSections
);

// UPDATE: Update a specific section by its own ID
router.patch("/sections/:sectionId", instructorAuth, updateSection);

// DELETE: Soft-delete a specific section by its own ID
router.delete("/sections/:sectionId", instructorAuth, deleteSection);

// RESTORE: Restore a soft-deleted section
router.patch("/sections/:sectionId/restore", instructorAuth, restoreSection);

export default router;
