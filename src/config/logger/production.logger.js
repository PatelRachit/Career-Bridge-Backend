import { createLogger, format, transports } from 'winston'
import { LOG_DIR } from '../../constant/index.js'
const { combine, timestamp, prettyPrint, errors, printf } = format

const logFormat = printf(({ level, message, timestamp, stack }) => {
  let logMessage = `${timestamp} [${level}]: ${message}`
  if (stack) {
    logMessage += `\nStack: ${stack}`
  }
  return logMessage
})

export const productionLogger = () => {
  return createLogger({
    level: 'debug',

    format: combine(
      timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
      errors({ stack: true }),
      prettyPrint(),
      logFormat,
    ),

    transports: [
      new transports.File({
        filename: `${LOG_DIR.ERROR_LOG_DIR}.log`,
        level: 'error',
        maxsize: 5 * 1024 * 1024,
      }),
      new transports.File({
        filename: `${LOG_DIR.INFO_LOG_DIR}.log`,
        level: 'info',
      }),
    ],
  })
}
