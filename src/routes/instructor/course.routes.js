import { Router } from "express";
import {
  createNewCourse,
  getInstructorCourses,
  getCourseById,
  updateCourseDetails,
  deleteCourse,
  restoreCourse,
  updateCourseThumbnail, // <-- Import the handler
} from "../../controllers/instructor/course.controller.js";
import {
  isAuthenticated,
  hasRole,
} from "../../shared/middleware/auth.middleware.js";
import { uploadImage } from "../../shared/middleware/upload.middleware.js";

const router = Router();
const instructorAuth = [isAuthenticated, hasRole("instructor")];

// C(R)UD: Create a new course
router.post("/courses", instructorAuth, createNewCourse);

// (R)EAD: Get all courses for the logged-in instructor
router.get("/courses", instructorAuth, getInstructorCourses);

// (R)EAD: Get a single course by its ID
router.get("/courses/:courseId", instructorAuth, getCourseById);

// (U)PDATE: Update a course's details
router.patch("/courses/:courseId", instructorAuth, updateCourseDetails);

// (D)ELETE: Delete a course
router.delete("/courses/:courseId", instructorAuth, deleteCourse);

// RESTORE: Restore a course that is pending deletion
router.patch("/courses/:courseId/restore", instructorAuth, restoreCourse);

// Route for thumbnail update
router.patch(
  "/courses/:courseId/thumbnail",
  instructorAuth,
  uploadImage.single("thumbnail"),
  updateCourseThumbnail // <-- Connect the controller function here
);

export default router;
