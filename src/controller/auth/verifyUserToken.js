import { STATUS_CODE } from '../../constant/index.js'
import Applicant from '../../model/Applicant.js'
import { handleError, itemNotFound } from '../../utils/index.js'
import { getUserIdFromToken } from './helpers/index.js'

/**
 * Verify user token function called by route
 */
const verifyUserToken = async (req, res) => {
  try {
    const token = req.cookies.authToken
    let email = await getUserIdFromToken(token)
    const user = await Applicant.findByEmail(email)
    if (!user?.email) {
      await itemNotFound(null, user, NOT_FOUND)
    }
    res.status(STATUS_CODE.SUCCESS).json(user)
  } catch (error) {
    console.log(error)
    handleError(res, error)
  }
}

export { verifyUserToken }
