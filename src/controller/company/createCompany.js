import { STATUS_CODE } from '../../constant/index.js'
import Company from '../../model/recruiter.js'
import { handleError } from '../../utils/index.js'

export const createCompany = async (req, res) => {
  try {
    const item = await Company.createCompany(req.body)
    console.log(item)
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    handleError(res, error)
  }
}
