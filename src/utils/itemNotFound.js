import { ERROR_CODE } from '../constant/index.js'
import { buildErrObject } from './buildErrObject.js'

const { NOT_FOUND } = ERROR_CODE

/**
 * Item not found
 */
export const itemNotFound = async (err, item, message = NOT_FOUND) => {
  if (err) {
    throw buildErrObject(422, err.message)
  }

  if (!item) {
    throw buildErrObject(404, message)
  }
}
