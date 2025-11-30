import { STATUS_CODE } from '../../../constant/index.js'
import Recruiter from '../../../model/recruiter.js'
import { handleError } from '../../../utils/index.js'

export const getWorkplaceTypes = async (req, res) => {
  try {
    const item = await Recruiter.getWorkplaceTypes()
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    handleError(res, error)
  }
}
