import * as EnrollmentService from "../../services/student/enrollment.service.js";

export const enrollInCourse = async (req, res, next) => {
  try {
    const studentId = req.user.id; // From isAuthenticated middleware
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required." });
    }

    const enrollment = await EnrollmentService.createEnrollment(
      studentId,
      courseId
    );
    res.status(201).json(enrollment);
  } catch (error) {
    next(error);
  }
};
