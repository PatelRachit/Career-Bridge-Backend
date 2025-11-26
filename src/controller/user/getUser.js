import { STATUS_CODE } from '../../constant/statusCode.js'
import { handleError } from '../../utils/handleError.js'
import Applicant from '../../model/Applicant.js'

const getUser = async (req, res) => {
  try {
    const { User_ID } = req.user
    const item = await Applicant.findById(User_ID)
    console.log(item)
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    handleError(res, error)
  }
}

export { getUser }
