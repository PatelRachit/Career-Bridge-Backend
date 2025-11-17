import mongoose from 'mongoose'
import { ERROR_CODE, STATUS_CODE } from '../constant/index.js'
import { buildErrObject } from './buildErrObject.js'

const { ID_MALFORMED } = ERROR_CODE

/**
 * Checks if given ID is good for MongoDB
 */
const isIDGood = async (id = '') =>
  new Promise((resolve, reject) => {
    const goodID = mongoose.Types.ObjectId.isValid(id)
    return goodID
      ? resolve(id)
      : reject(buildErrObject(STATUS_CODE.UNPROCESSABLE, ID_MALFORMED))
  })

export { isIDGood }
