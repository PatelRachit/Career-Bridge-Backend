import { STATUS_CODE } from '../../constant/index.js'
import Application from '../../model/applications.js'
import { handleError } from '../../utils/index.js'

export const withdrawApplication = async (req, res) => {
  try {
    const { user_id } = req.user
    const { id } = req.params
    await Application.withdrawApplication(id, user_id)
    const item = await Application.getUserApplications(user_id)

    res.status(STATUS_CODE.SUCCESS).json(item)
  } catch (error) {
    handleError(res, error)
  }
}
