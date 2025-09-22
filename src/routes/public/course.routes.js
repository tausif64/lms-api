import { Router } from "express";
import { getAllCourses, searchCourses } from "../../controllers/public/course.controller.js";

const router = Router();
router.get("/courses", getAllCourses);
router.get("/courses/search", searchCourses);

export default router;
