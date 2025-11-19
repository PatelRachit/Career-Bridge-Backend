import { ERROR_CODE } from '../constant/index.js'
import { buildErrObject } from '../utils/buildErrObject.js'
import { queryBuilder } from '../utils/queryBuilder.js'

const { EMAIL_ALREADY_EXISTS } = ERROR_CODE

const emailExists = async (email) => {
  try {
    const items = await queryBuilder('SELECT id FROM users WHERE email = ?', [
      email,
    ])

    if (items.length > 0) {
      throw buildErrObject(422, EMAIL_ALREADY_EXISTS)
    }

    return false
  } catch (err) {
    // If it's already a built error object, throw it as is
    if (err.code && err.message) {
      throw err
    }
    // Otherwise, it's a database error
    throw buildErrObject(422, err.message)
  }
}

export { emailExists }
