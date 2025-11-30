import { STATUS_CODE } from '../../constant/index.js'
import Recruiter from '../../model/recruiter.js'
import { handleError } from '../../utils/index.js'

export const getApplicantsByJob = async (req, res) => {
  try {
    const { id } = req.params

    const item = await Recruiter.getApplicantsByJob(id)
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    handleError(res, error)
  }
}
