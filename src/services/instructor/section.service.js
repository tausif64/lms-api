import prisma from "../../config/db.js";

export const restoreSectionById = async (ownerId, sectionId) => {
  // 1. Security Check: Verify ownership and get the section
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { course: true },
  });

  if (!section || section.course.ownerId !== ownerId) {
    throw new Error("FORBIDDEN");
  }

  // 2. Validation Check: Ensure the section is actually soft-deleted
  if (!section.deletedAt) {
    throw new Error("NOT_RESTORABLE"); // Can't restore a section that isn't deleted
  }

  // 3. Logic: Place the restored section at the end of the list to avoid order conflicts
  const sectionCount = await prisma.section.count({
    where: { courseId: section.courseId, deletedAt: null },
  });
  const newOrderIndex = sectionCount;

  // 4. Update: Set deletedAt to null and update the orderIndex
  return await prisma.section.update({
    where: { id: sectionId },
    data: {
      deletedAt: null,
      orderIndex: newOrderIndex,
    },
  });
};

export const findDeletedSectionsByCourse = async (ownerId, courseId) => {
  // 1. Security Check
  await verifyCourseOwnership(ownerId, courseId);

  // 2. Query: Find all soft-deleted sections for the course
  return await prisma.section.findMany({
    where: {
      courseId,
      deletedAt: { not: null },
    },
    orderBy: {
      deletedAt: "desc", // Show the most recently deleted first
    },
  });
};


const verifyCourseOwnership = async (ownerId, courseId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });
  // Check for existence, ownership, AND soft-delete status of the course
  if (!course || course.ownerId !== ownerId || course.deletedAt) {
    throw new Error("FORBIDDEN");
  }
  return course;
};


export const createSectionForCourse = async (ownerId, courseId, title) => {
  await verifyCourseOwnership(ownerId, courseId);

  // CORRECTED: Only count non-deleted sections to determine the correct order.
  const sectionCount = await prisma.section.count({
    where: { courseId, deletedAt: null },
  });
  const newOrderIndex = sectionCount;

  return await prisma.section.create({
    data: {
      courseId,
      title,
      orderIndex: newOrderIndex,
    },
  });
};


export const findSectionsByCourse = async (ownerId, courseId) => {
  await verifyCourseOwnership(ownerId, courseId);

  // This query was already correct, ensuring only active sections are returned.
  return await prisma.section.findMany({
    where: {
      courseId,
      deletedAt: null,
    },
    orderBy: {
      orderIndex: "asc",
    },
  });
};


export const updateSectionById = async (ownerId, sectionId, updateData) => {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { course: { select: { ownerId: true } }, deletedAt: true },
  });

  // CORRECTED: Added checks for soft-deletion status.
  if (!section || section.course.ownerId !== ownerId) {
    throw new Error("FORBIDDEN");
  }
  if (section.deletedAt) {
    // Prevent updates on an already deleted section
    throw new Error("FORBIDDEN");
  }

  return await prisma.section.update({
    where: { id: sectionId },
    data: {
      title: updateData.title,
      orderIndex: updateData.orderIndex,
    },
  });
};


export const softDeleteSectionById = async (ownerId, sectionId) => {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { course: { select: { ownerId: true } } },
  });

  if (!section || section.course.ownerId !== ownerId) {
    throw new Error("FORBIDDEN");
  }

  // This logic for soft-deleting was already correct.
  return await prisma.section.update({
    where: { id: sectionId },
    data: {
      deletedAt: new Date(),
    },
  });
};
