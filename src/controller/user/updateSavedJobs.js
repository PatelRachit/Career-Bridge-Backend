import { STATUS_CODE } from '../../constant/index.js'
import Application from '../../model/applications.js'
import { handleError } from '../../utils/index.js'

export const updateSavedJobs = async (req, res) => {
  try {
    const { id } = req.params
    const user = req.user
    await Application.unsaveJob(user.user_id, id)
    const item = await Application.getSavedJobs(user.user_id)

    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    handleError(res, error)
  }
}
