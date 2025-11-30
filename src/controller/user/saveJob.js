import { STATUS_CODE } from '../../constant/index.js'
import Application from '../../model/applications.js'
import { handleError } from '../../utils/index.js'

export const saveJob = async (req, res) => {
  try {
    const { id } = req.params
    const user = req.user
    const item = await Application.saveJob(user.user_id, id)
    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    handleError(res, error)
  }
}
