import jwt from 'jsonwebtoken'
import { ERROR_CODE } from '../../../constant/index.js'
import { buildErrObject } from '../../../utils/index.js'

const { BAD_TOKEN } = ERROR_CODE

/**
 * Gets user id from token
 * @param {string} token - Encrypted and encoded token
 */
const getUserIdFromToken = (token = '') =>
  new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(buildErrObject(409, BAD_TOKEN))
      }
      resolve(decoded.data.email)
    })
  })

export { getUserIdFromToken }
