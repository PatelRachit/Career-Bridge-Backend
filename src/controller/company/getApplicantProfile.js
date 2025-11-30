import { STATUS_CODE } from '../../constant/statusCode.js'
import { handleError } from '../../utils/handleError.js'
import Applicant from '../../model/Applicant.js'

export const getApplicantProfile = async (req, res) => {
  try {
    const { id } = req.params
    const item = await Applicant.findById(id)
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    handleError(res, error)
  }
}
