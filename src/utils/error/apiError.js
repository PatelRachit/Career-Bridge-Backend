import { CustomError } from './customError.js'

class ApiError extends CustomError {
  errorCode
  statusCode

  constructor(message, errorCode, statusCode) {
    super(message)
    this.errorCode = errorCode
    this.statusCode = statusCode

    Object.setPrototypeOf(this, ApiError.prototype)
  }

  serializeErrors() {
    return {
      code: this.errorCode,
      message: this.message,
    }
  }
}

export { ApiError }
