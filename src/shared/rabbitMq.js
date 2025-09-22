import amqp from "amqplib";
import logger from "../config/logger.js";
import prisma from "../config/db.js"; // Import Prisma to interact with the database

export let amqpChannel = null;

const QUEUES = {
  VIDEO_PROCESSING: "video_processing_queue",
  VIDEO_RESULT: "video_result_queue",
};

export const connectRabbitMQ = async () => {
  try {
    const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq";
    const connection = await amqp.connect(RABBITMQ_URL);
    amqpChannel = await connection.createChannel();

    await amqpChannel.assertQueue(QUEUES.VIDEO_PROCESSING, { durable: true });
    await amqpChannel.assertQueue(QUEUES.VIDEO_RESULT, { durable: true });

    logger.info("✅ RabbitMQ connection established and channel created.");

    // Start consuming results from the processor
    startResultConsumer();
  } catch (error) {
    logger.error("❌ Failed to connect to RabbitMQ", { error: error.message });
    process.exit(1);
  }
};

/**
 * Listens for messages on the result queue and updates the database.
 */
const startResultConsumer = () => {
  amqpChannel.consume(QUEUES.VIDEO_RESULT, async (msg) => {
    if (msg !== null) {
      try {
        const result = JSON.parse(msg.content.toString());
        logger.info("[Backend] Received video processing result.", { result });

        // Find the lecture that this result belongs to
        const lecture = await prisma.lecture.findUnique({
          where: { id: result.lectureId },
        });

        if (lecture) {
          // Update the lecture record based on the processing result
          if (result.status === "COMPLETED") {
            await prisma.lecture.update({
              where: { id: result.lectureId },
              data: {
                // Update the videoUrl to the new HLS playlist path
                videoUrl: result.hls_url,
                videoDurationSeconds: result.duration,
              },
            });
            logger.info(
              `[Backend] Updated lecture ${result.lectureId} with HLS URL.`
            );
          } else if (result.status === "FAILED") {
            // If processing failed, we can clear the videoUrl or log the error
            await prisma.lecture.update({
              where: { id: result.lectureId },
              data: { videoUrl: null }, // Set URL to null to indicate failure
            });
            logger.error(
              `[Backend] Video processing failed for lecture ${result.lectureId}`,
              { error: result.error }
            );
          }
        } else {
          logger.warn(
            `[Backend] Received result for a non-existent lecture: ${result.lectureId}`
          );
        }

        // Acknowledge the message to remove it from the queue
        amqpChannel.ack(msg);
      } catch (error) {
        logger.error("[Backend] Error processing result message.", {
          error: error.message,
        });
        // Acknowledge the message anyway to avoid it getting stuck in a loop
        amqpChannel.ack(msg);
      }
    }
  });
};
