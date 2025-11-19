import { STATUS_CODE } from '../../constant/statusCode.js'
import { handleError } from '../../utils/handleError.js'
import Applicant from '../../model/Applicant.js'
import { returnRegisterToken } from './helpers/returnRegisterToken.js'
import { setUserInfo } from './helpers/setUserInfo.js'

const createUser = async (req, res) => {
  try {
    console.log('Request Body:', req.body) // Debugging line to check request body
    const doesEmailExists = await Applicant.emailExists(req.body.email)

    if (!doesEmailExists) {
      const item = await Applicant.create(req.body)
      const userInfo = await setUserInfo(item)
      const response = await returnRegisterToken(item, userInfo)
      res
        .cookie('authToken', response.token, {
          httpOnly: true,
          sameSite: 'None',
          secure: true,
        })
        .status(STATUS_CODE.SUCCESS)
        .json(response)
    }
  } catch (error) {
    handleError(res, error)
  }
}

export { createUser }
