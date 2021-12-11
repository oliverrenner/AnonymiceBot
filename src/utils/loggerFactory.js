const { createLogger, format, transports } = require("winston");
const fs = require("fs");
const path = require("path");

const env = process.env.NODE_ENV || "development";

class LoggerFactory {

  create(logDir, logFile, label) {
    // Create the log directory if it does not exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    const filename = path.join(logDir, logFile);

    const logger = createLogger({
      // change level if in dev environment versus production
      level: env === "production" ? "info" : "debug",
      format: format.combine(
        format.label({ label: label }),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" })
      ),
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(
              (info) =>
                `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
            )
          ),
        }),
        new transports.File({
          filename,
          format: format.combine(
            format.printf(
              (info) =>
                `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
            )
          ),
        }),
      ],
    });

    return logger;
  }
}

module.exports = new LoggerFactory();
