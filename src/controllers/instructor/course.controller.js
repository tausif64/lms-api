import * as CourseService from "../../services/instructor/course.service.js";

export const getInstructorCourses = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const courses = await CourseService.findCoursesByOwner(ownerId);
    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { courseId } = req.params;
    const course = await CourseService.findCourseByIdAndOwner(
      courseId,
      ownerId
    );
    if (!course) {
      return res
        .status(404)
        .json({ message: "Course not found or you do not have access." });
    }
    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

// CORRECTED: This function now passes the ownerId for the security check.
export const updateCourseThumbnail = async (req, res, next) => {
  try {
    const ownerId = req.user.id; // <-- Get the owner's ID
    const { courseId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded." });
    }

    const thumbnailUrl = `/${req.file.path.replace(/\\/g, "/")}`;

    const updatedCourse = await CourseService.updateCourse(
      courseId,
      ownerId, // <-- Pass it to the service
      { thumbnailUrl }
    );
    res.status(200).json(updatedCourse);
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this course." });
    }
    next(error);
  }
};

export const createNewCourse = async (req, res, next) => {
  try {
    const ownerId = req.user.id; // From middleware
    const courseData = req.body; // title, subtitle, etc.

    const course = await CourseService.createCourse(ownerId, courseData);
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
};

export const updateCourseDetails = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { courseId } = req.params;
    const courseData = req.body;

    const updatedCourse = await CourseService.updateCourse(
      courseId,
      ownerId,
      courseData
    );
    res.status(200).json(updatedCourse);
  } catch (error) {
    // Custom error handling for authorization
    if (error.message === "FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this course." });
    }
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { courseId } = req.params;

    await CourseService.softDeleteCourse(courseId, ownerId);
    res.status(204).send(); // 204 No Content is standard for successful deletions
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this course." });
    }
    next(error);
  }
};

export const restoreCourse = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { courseId } = req.params;

    await CourseService.restoreCourseById(courseId, ownerId);
    res.status(200).json({ message: "Course restored successfully." });
  } catch (error) {
    if (error.message === "FORBIDDEN" || error.message === "NOT_RESTORABLE") {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};
