import prisma from "../../config/db.js";
import { amqpChannel } from "../../shared/rabbitMq.js";

// Helper to verify instructor owns the lecture's parent section/course
const verifyLectureOwnership = async (ownerId, lectureId) => {
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    select: { section: { select: { course: { select: { ownerId: true } } } } },
  });
  if (!lecture || lecture.section.course.ownerId !== ownerId) {
    throw new Error("FORBIDDEN");
  }
  return lecture;
};

// Helper to verify ownership of the section a new lecture is being added to
const verifySectionOwnership = async (ownerId, sectionId) => {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { course: { select: { ownerId: true } } },
  });
  if (!section || section.course.ownerId !== ownerId) {
    throw new Error("FORBIDDEN");
  }
  return section;
};

export const createLectureForSection = async (ownerId, sectionId, title) => {
  await verifySectionOwnership(ownerId, sectionId);
  const lectureCount = await prisma.lecture.count({
    where: { sectionId, deletedAt: null },
  });
  return prisma.lecture.create({
    data: {
      sectionId,
      title,
      orderIndex: lectureCount,
    },
  });
};

export const findLecturesBySection = async (ownerId, sectionId) => {
  await verifySectionOwnership(ownerId, sectionId);
  return prisma.lecture.findMany({
    where: { sectionId, deletedAt: null },
    orderBy: { orderIndex: "asc" },
  });
};

export const findDeletedLecturesBySection = async (ownerId, sectionId) => {
  await verifySectionOwnership(ownerId, sectionId);
  return prisma.lecture.findMany({
    where: { sectionId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
  });
};

export const updateLectureById = async (ownerId, lectureId, updateData) => {
  await verifyLectureOwnership(ownerId, lectureId);
  return prisma.lecture.update({
    where: { id: lectureId },
    data: {
      title: updateData.title,
      description: updateData.description,
      isPreviewable: updateData.isPreviewable,
    },
  });
};

export const softDeleteLectureById = async (ownerId, lectureId) => {
  await verifyLectureOwnership(ownerId, lectureId);
  return prisma.lecture.update({
    where: { id: lectureId },
    data: { deletedAt: new Date() },
  });
};

export const restoreLectureById = async (ownerId, lectureId) => {
  await verifyLectureOwnership(ownerId, lectureId);
  const lecture = await prisma.lecture.findUnique({ where: { id: lectureId } });
  if (!lecture.deletedAt) throw new Error("NOT_RESTORABLE");

  const lectureCount = await prisma.lecture.count({
    where: { sectionId: lecture.sectionId, deletedAt: null },
  });

  return prisma.lecture.update({
    where: { id: lectureId },
    data: {
      deletedAt: null,
      orderIndex: lectureCount, // Place at the end
    },
  });
};

export const handleLectureVideoUpload = async (ownerId, lectureId, file) => {
  await verifyLectureOwnership(ownerId, lectureId);
  const videoUrl = `/${file.path.replace(/\\/g, "/")}`; // Normalize path for web

  // 1. Update the lecture record with the path to the raw video file
  const updatedLecture = await prisma.lecture.update({
    where: { id: lectureId },
    data: { videoUrl },
  });

  // 2. Send a job to the video processor service via RabbitMQ
  const job = { lectureId, fileName: file.filename };
  const jobQueue = "video_processing_queue";
  amqpChannel.sendToQueue(jobQueue, Buffer.from(JSON.stringify(job)), {
    persistent: true,
  });

  console.log(
    `[Backend] Sent video processing job for lectureId: ${lectureId}`
  );
  return updatedLecture;
};
