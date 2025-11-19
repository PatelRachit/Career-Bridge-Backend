import { ERROR_CODE, STATUS_CODE } from '../../constant/index.js'
import { buildErrObject, handleError } from '../../utils/index.js'
import { returnRegisterToken, setUserInfo } from '../user/helpers/index.js'
import Applicant from '../../model/Applicant.js'

const { WRONG_PASSWORD, NOT_FOUND } = ERROR_CODE

const login = async (req, res) => {
  try {
    const user = await Applicant.findByEmail(req.body.email)
    if (user?.email) {
      const isPasswordMatch = await Applicant.comparePassword(
        req.body.password,
        user.password,
      )

      if (!isPasswordMatch) {
        handleError(res, buildErrObject(STATUS_CODE.CONFLICT, WRONG_PASSWORD))
      } else {
        // all ok, return token and response
        const response = await returnRegisterToken(user, user)
        res
          .cookie('authToken', response.token, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
          })
          .status(STATUS_CODE.SUCCESS)
          .json(response)
      }
    } else {
      handleError(res, buildErrObject(STATUS_CODE.UNAUTHORIZED, NOT_FOUND))
    }
  } catch (error) {
    handleError(res, error)
  }
}

export { login }
