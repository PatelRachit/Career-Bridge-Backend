import { validationResult } from 'express-validator'
import { buildErrObject } from './buildErrObject.js'
import { handleError } from './handleError.js'

const validateResult = (req, res, next) => {
  try {
    validationResult(req).throw()
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase()
    }
    next()
  } catch (err) {
    console.log(err)
    handleError(res, buildErrObject(422, err.array()))
  }
}

export { validateResult }
