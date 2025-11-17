import logger from '../config/logger/index.js'
import { CustomError } from '../utils/error/customError.js'

const errorHandler = (error, _req, res, _next) => {
  logger.error(error)

  if (error instanceof CustomError) {
    return res.status(error.statusCode).json({ ...error.serializeErrors() })
  }

  res.status(500).send('Something went wrong!!')
}

export { errorHandler }
