import { createLogger, format, LoggerOptions, transports } from 'winston';
const { combine, timestamp, printf, colorize, prettyPrint, metadata } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const isRunningOnVercel = !!process.env.VERCEL;

let fileTransports = [];
if (!isRunningOnVercel) {
  fileTransports.push(
    new transports.File({
      dirname: 'logs',
      filename: 'error.log',
      level: 'error',
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), prettyPrint(), logFormat),
    }),
    new transports.File({
      dirname: 'logs',
      filename: 'combined.log',
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), prettyPrint(), logFormat),
    }),
  );
}

const loggerInstance: LoggerOptions = {
  level: 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  defaultMeta: {
    service: 'QuickMeet',
  },
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), prettyPrint(), logFormat),
    }),
    ...fileTransports,
  ],
};

export const winstonInstance = createLogger(loggerInstance);
