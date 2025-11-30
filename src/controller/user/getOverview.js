import { STATUS_CODE } from '../../constant/statusCode.js'
import Application from '../../model/applications.js'

export const getOverview = async (req, res) => {
  try {
    const { user_id } = req.user
    const counts = await Application.getApplicationCount(user_id)
    const recentApplications = await Application.getRecentApplications(
      user_id,
      3,
    )
    res.status(STATUS_CODE.SUCCESS).json({ recentApplications, counts })
  } catch (error) {
    console.log(error)
  }
}
