import prisma from "../../config/db.js";

export const createEnrollment = async (studentId, courseId) => {
  // In a real app, you'd check if the course is paid and handle payment here
  return await prisma.enrollment.create({
    data: {
      studentId,
      courseId,
    },
  });
};
