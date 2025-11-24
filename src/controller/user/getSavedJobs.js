import { STATUS_CODE } from '../../constant/index.js'
import Application from '../../model/applications.js'
import { handleError } from '../../utils/index.js'

export const getSavedJobs = async (req, res) => {
  try {
    const { applicant_id } = req.user
    const item = await Application.getSavedJobs(applicant_id)
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    handleError(res, error)
  }
}
