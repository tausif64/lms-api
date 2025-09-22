import cron from "node-cron";
import prisma from "../../config/db.js";
import { promises as fs } from "fs";
import path from "path";
import logger from "../../config/logger.js";

/**
 * A helper function to safely delete a file from the media directory.
 * @param {string | null | undefined} relativePath - The path stored in the database (e.g., /media/raw/file.jpg)
 */
const deleteMediaFile = async (relativePath) => {
  if (!relativePath) return;

  const absolutePath = path.join(process.cwd(), relativePath.substring(1));

  try {
    await fs.unlink(absolutePath);
    logger.info('[CRON] Deleted media file:' + absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      logger.error('[CRON] Error deleting file'+ absolutePath+': ', {
        error: error.message,
      });
    }
  }
};

const cleanupExpiredCourses = async () => {
  const twentyFourHoursAgo = new Date(
    new Date().getTime() - 24 * 60 * 60 * 1000
  );

  const expiredCourses = await prisma.course.findMany({
    where: {
      status: "PENDING_DELETION",
      deletedAt: { lt: twentyFourHoursAgo },
    },
    select: {
      id: true,
      thumbnailUrl: true,
      promoVideoUrl: true,
      sections: {
        select: { lectures: { select: { videoUrl: true } } },
      },
    },
  });

  if (expiredCourses.length === 0) {
    logger.info("[CRON] No expired courses to clean up.");
    return;
  }

  for (const course of expiredCourses) {
    await deleteMediaFile(course.thumbnailUrl);
    await deleteMediaFile(course.promoVideoUrl);
    for (const section of course.sections) {
      for (const lecture of section.lectures) {
        await deleteMediaFile(lecture.videoUrl);
      }
    }
  }

  const idsToDelete = expiredCourses.map((c) => c.id);
  logger.info(
    `[CRON] Permanently deleting ${idsToDelete.length} expired courses.`,
    { courseIds: idsToDelete }
  );
  await prisma.course.deleteMany({ where: { id: { in: idsToDelete } } });
};

const cleanupExpiredSections = async () => {
  const twentyFourHoursAgo = new Date(
    new Date().getTime() - 24 * 60 * 60 * 1000
  );
  const expiredSections = await prisma.section.findMany({
    where: { deletedAt: { not: null, lt: twentyFourHoursAgo } },
    include: { lectures: { select: { videoUrl: true } } },
  });

  if (expiredSections.length === 0) {
    logger.info("[CRON] No expired sections to clean up.");
    return;
  }

  for (const section of expiredSections) {
    for (const lecture of section.lectures) {
      await deleteMediaFile(lecture.videoUrl);
    }
  }

  const idsToDelete = expiredSections.map((s) => s.id);
  logger.info(
    `[CRON] Permanently deleting ${idsToDelete.length} expired sections.`,
    { sectionIds: idsToDelete }
  );
  await prisma.section.deleteMany({ where: { id: { in: idsToDelete } } });
};

const cleanupExpiredLectures = async () => {
  const twentyFourHoursAgo = new Date(
    new Date().getTime() - 24 * 60 * 60 * 1000
  );
  const expiredLectures = await prisma.lecture.findMany({
    where: { deletedAt: { not: null, lt: twentyFourHoursAgo } },
    select: { id: true, videoUrl: true },
  });

  if (expiredLectures.length === 0) {
    logger.info("[CRON] No expired lectures to clean up.");
    return;
  }

  for (const lecture of expiredLectures) {
    await deleteMediaFile(lecture.videoUrl);
  }

  const idsToDelete = expiredLectures.map((l) => l.id);
  logger.info(
    `[CRON] Permanently deleting ${idsToDelete.length} expired lectures.`,
    { lectureIds: idsToDelete }
  );
  await prisma.lecture.deleteMany({ where: { id: { in: idsToDelete } } });
};

const runAllCleanupTasks = async () => {
  logger.info("[CRON] Starting hourly cleanup job.");
  try {
    await cleanupExpiredCourses();
    await cleanupExpiredSections();
    await cleanupExpiredLectures();
  } catch (error) {
    logger.error(
      "[CRON] A critical error occurred during the scheduled cleanup job.",
      { error: error.message, stack: error.stack }
    );
  }
  logger.info("[CRON] Hourly cleanup job finished.");
};

export const startCleanupScheduler = () => {
  cron.schedule("0 * * * *", runAllCleanupTasks, {
    scheduled: true,
    timezone: "UTC",
  });
  logger.info("✅ Cleanup scheduler is running and will execute hourly.");
};
