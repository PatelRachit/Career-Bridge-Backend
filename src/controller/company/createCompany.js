import { STATUS_CODE } from '../../constant/index.js'
import Company from '../../model/company.js'
import { handleError } from '../../utils/index.js'

export const createCompany = async (req, res) => {
  try {
    const item = await Company.createCompany(req.body)
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    console.log(error)
    handleError(res, error)
  }
}
