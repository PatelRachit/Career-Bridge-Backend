import { STATUS_CODE } from '../../constant/statusCode.js'
import Application from '../../model/applications.js'

export const getOverview = async (req, res) => {
  try {
    const { applicant_id } = req.user
    const counts = await Application.getApplicationCount(applicant_id)
    const recentApplications = await Application.getRecentApplications(
      applicant_id,
      3,
    )
    res.status(STATUS_CODE.SUCCESS).json({ recentApplications, counts })
  } catch (error) {
    console.log(error)
  }
}
