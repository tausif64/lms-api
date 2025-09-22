import * as CourseService from "../../services/public/course.service.js";

export const getAllCourses = async (req, res, next) => {
  try {
    const courses = await CourseService.findAllCourses();
    res.status(200).json(courses);
  } catch (error) {
    next(error); // Pass error to a central error handler
  }
};


export const searchCourses = async (req, res, next) => {
  try {
    const { query } = req.query;
    const result = await CourseService.searchCoursesService(query);
    res.status(200).json(result);
  } catch(error) {
    next(error);
  }
}