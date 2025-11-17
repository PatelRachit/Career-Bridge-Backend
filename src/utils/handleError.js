import { STATUS_CODE } from '../constant/statusCode.js'

/**
 * Handles error by printing to console in development env and builds and sends an error response
 */
const handleError = (res, err) => {
  // Prints error in console
  if (process.env.NODE_ENV === 'development') {
    console.log(err)
  }

  // Sends error to user
  res.status(err?.code || STATUS_CODE.UNPROCESSABLE).json({
    errors: {
      msg: err.message,
    },
  })
}

export { handleError }
