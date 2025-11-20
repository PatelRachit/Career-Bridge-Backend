import { STATUS_CODE } from '../../constant/statusCode.js'
import { handleError } from '../../utils/handleError.js'
import Applicant from '../../model/Applicant.js'

const getUser = async (req, res) => {
  try {
    const { applicant_id } = req.user
    const item = await Applicant.findById(applicant_id)
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    handleError(res, error)
  }
}

export { getUser }
