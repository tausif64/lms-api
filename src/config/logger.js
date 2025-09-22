import winston from "winston";
import fs from "fs";
import path from "path";

// Define the log directory path relative to the project root
const logDir = "logs";

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

/**
 * Creates and configures a Winston logger instance for the application.
 * This logger is designed to be reusable across the entire backend.
 */
const logger = winston.createLogger({
  // Set the default logging level.
  // 'info' means it will log messages with level 'info', 'warn', and 'error'.
  level: "info",

  // Define the format of the log messages.
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss", // Add a timestamp to each log entry.
    }),
    winston.format.json() // Log in a structured JSON format.
  ),

  // Define where the logs should be sent ("transports").
  transports: [
    // Transport 1: Log all errors to a dedicated `error.log` file.
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),

    // Transport 2: Log all messages (info and above) to a `combined.log` file.
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
  ],
});

// If the environment is not 'production', also add a transport to log to the console.
// This is useful for development and for viewing logs with `docker logs`.
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Add colors to the console output for readability.
        winston.format.simple() // Use a simple, one-line format.
      ),
    })
  );
}

export default logger;
