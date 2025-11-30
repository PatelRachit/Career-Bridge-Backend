import { STATUS_CODE } from '../../constant/index.js'
import Recruiter from '../../model/recruiter.js'
import { handleError } from '../../utils/index.js'

export const createJob = async (req, res) => {
  try {
    const data = req.body
    const { user_id } = req.user
    const item = Recruiter.createJob(data, user_id)
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    console.log(error)
    handleError(res, error)
  }
}
