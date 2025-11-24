import { STATUS_CODE } from '../../constant/index.js'
import Application from '../../model/applications.js'
import { handleError } from '../../utils/index.js'

export const getApplications = async (req, res) => {
  try {
    const applicant_id = req.user.applicant_id
    const item = await Application.getApplicantApplications(applicant_id)
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    handleError(res, error)
  }
}
