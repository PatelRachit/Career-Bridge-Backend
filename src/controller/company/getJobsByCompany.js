import { STATUS_CODE } from '../../constant/index.js'
import Company from '../../model/recruiter.js'
import { handleError } from '../../utils/index.js'

export const getJobsByCompany = async (req, res) => {
  try {
    const { user_id } = req.user
    const item = await Company.getJobsByCompany(user_id)
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    handleError(res, error)
  }
}
