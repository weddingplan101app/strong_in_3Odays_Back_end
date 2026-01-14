import dotenv from "dotenv"
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import winston, { Logger } from 'winston';
import winstonDaily from 'winston-daily-rotate-file';

// Load environment variables
dotenv.config();

// Define log directory - using process.cwd() for absolute path
const LOG_DIR = process.env.LOG_DIR || 'logs';
const logDir: string = join(process.cwd(), LOG_DIR);

// Create logs directory if it doesn't exist
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}
/* --------------------------- defining log format -------------------------- */

// Define log format
const logFormat = winston.format.printf(
  ({ level, message, timestamp, stack }) => {
    const logMessage = stack || message;
    return `${timestamp} [${level.toUpperCase()}] ${logMessage}`;
  }
);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

/* --------------------------- CREATING THE LOGGER -------------------------- */

// Create the logger
const logger: Logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    logFormat
  ),
  transports: [
    // Debug logs
    new winstonDaily({
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      dirname: join(logDir, 'debug'),
      filename: '%DATE%.log',
      maxFiles: '30d',
      json: false,
      zippedArchive: true,
    }),
    // Error logs
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: join(logDir, 'error'),
      filename: '%DATE%.log',
      maxFiles: '30d',
      handleExceptions: true,
      json: false,
      zippedArchive: true,
    }),
  ],
  exitOnError: false,
});

// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Stream for morgan
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export { logger, stream };