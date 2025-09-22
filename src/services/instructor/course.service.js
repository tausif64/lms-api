import prisma from "../../config/db.js";
import { customAlphabet } from "nanoid";

// IMPROVED: Slug generation is slightly more robust.
export const createCourse = async (ownerId, courseData) => {
  if (!courseData.title) {
    throw new Error("Course title is required.");
  }

  const baseSlug = courseData.title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  let slug = baseSlug;

  while (await prisma.course.findUnique({ where: { slug } })) {
    const nanoid = customAlphabet("1234567890abcdef", 6);
    slug = `${baseSlug}-${nanoid()}`; // Always generate from the base slug
  }

  try {
    const newCourse = await prisma.course.create({
      data: {
        ownerId,
        title: courseData.title,
        slug,
        subtitle: courseData.subtitle,
        description: courseData.description,
        categoryId: courseData.categoryId,
        level: courseData.level || "BEGINNER",
        language: courseData.language || "English",
        estimatedHours: courseData.estimatedHours,
        isPaid: courseData.isPaid ?? true,
        isPracticeTestCourse: courseData.isPracticeTestCourse ?? false,
        hasCertificate: courseData.hasCertificate ?? true,
        isQnAEnabled: courseData.isQnAEnabled ?? true,
      },
    });
    return newCourse;
  } catch (error) {
    console.error("Error creating course:", error);
    throw new Error("Could not create the course.");
  }
};

// CORRECTED: Merged the 24-hour grace period logic here.
export const findCoursesByOwner = async (ownerId) => {
  const twentyFourHoursAgo = new Date(
    new Date().getTime() - 24 * 60 * 60 * 1000
  );
  return await prisma.course.findMany({
    where: {
      ownerId,
      OR: [
        { status: { not: "PENDING_DELETION" } },
        {
          status: "PENDING_DELETION",
          deletedAt: { gte: twentyFourHoursAgo },
        },
      ],
    },
  });
};

// CORRECTED: Also merged the 24-hour grace period logic here.
export const findCourseByIdAndOwner = async (courseId, ownerId) => {
  const twentyFourHoursAgo = new Date(
    new Date().getTime() - 24 * 60 * 60 * 1000
  );
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      ownerId,
    },
  });

  if (!course) return null; // Course doesn't exist or isn't owned by the user

  // If the course is pending deletion, check if it's within the grace period
  if (
    course.status === "PENDING_DELETION" &&
    course.deletedAt < twentyFourHoursAgo
  ) {
    return null; // It's outside the grace period, so treat as not found
  }

  return course;
};

// ... updateCourse, softDeleteCourse, and restoreCourseById are correct ...
// (No changes needed for the other service functions)
export const updateCourse = async (courseId, ownerId, courseData) => {
  // 1. First, find the course to check for existence and ownership
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error("Course not found.");
  } // 2. !! CRITICAL SECURITY CHECK !!

  if (course.ownerId !== ownerId) {
    throw new Error("FORBIDDEN"); // Throw a specific error for the controller to catch
  } // 3. If checks pass, update the course
  return await prisma.course.update({
    where: { id: courseId },
    data: courseData,
  });
};

export const softDeleteCourse = async (courseId, ownerId) => {
  // 1. Verify ownership first
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error("Course not found.");
  } // 2. !! CRITICAL SECURITY CHECK !!
  if (course.ownerId !== ownerId) {
    throw new Error("FORBIDDEN");
  } // 3. Perform a "soft delete" instead of a destructive delete. // This is best practice as it preserves data for analytics or recovery.

  return await prisma.course.update({
    where: { id: courseId },
    data: {
      status: "PENDING_DELETION",
      deletedAt: new Date(),
    },
  });
};

export const restoreCourseById = async (courseId, ownerId) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) throw new Error("Course not found.");
  if (course.ownerId !== ownerId) throw new Error("FORBIDDEN");
  if (course.status !== "PENDING_DELETION" || !course.deletedAt) {
    throw new Error("NOT_RESTORABLE"); // Course is not pending deletion
  } // Check if the 24-hour window has passed

  const twentyFourHours = 24 * 60 * 60 * 1000;
  const timeSinceDeletion = new Date().getTime() - course.deletedAt.getTime();

  if (timeSinceDeletion > twentyFourHours) {
    throw new Error("NOT_RESTORABLE"); // Grace period has expired
  } // Restore the course by clearing the deletion flag and setting status back to DRAFT

  return await prisma.course.update({
    where: { id: courseId },
    data: {
      status: "DRAFT", // Restore to a safe default status
      deletedAt: null,
    },
  });
};
