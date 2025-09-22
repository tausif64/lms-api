import { Router } from "express";
import { enrollInCourse } from "../../controllers/student/enrollment.controller.js";
import {
  isAuthenticated,
  hasRole,
} from "../../shared/middleware/auth.middleware.js";

const router = Router();
router.post("/enroll", isAuthenticated, hasRole("student"), enrollInCourse);

export default router;
