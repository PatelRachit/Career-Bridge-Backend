import { STATUS_CODE } from '../../constant/index.js'
import Application from '../../model/applications.js'
import { handleError } from '../../utils/index.js'

export const getApplications = async (req, res) => {
  try {
    const user_id = req.user.user_id
    const item = await Application.getUserApplications(user_id)
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    handleError(res, error)
  }
}
