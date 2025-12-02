import { STATUS_CODE } from '../../constant/index.js'
import Applicant from '../../model/Applicant.js'
import Job from '../../model/Job.js'
import Application from '../../model/applications.js'
import { buildErrObject, handleError } from '../../utils/index.js'
import { getUserIdFromToken } from '../auth/helpers/getUserIdFromToken.js'

const getJob = async (req, res) => {
  try {
    const token = req?.cookies?.authToken
    let hasApplied = false
    let isSaved = false

    const { id } = req.params
    const job = await Job.findById(id)

    console.log('Job:', job)

    if (token) {
      let email = await getUserIdFromToken(token)
      const user = await Applicant.findByEmail(email)
      if (user && user.user_id) {
        const applicantId = user.user_id

        // Check if user has applied for this job
        hasApplied = await Application.hasApplied(applicantId, id)

        // Check if user has saved this job
        isSaved = await Application.isJobSaved(applicantId, id)
      }
    }

    if (!job) {
      return handleError(
        res,
        buildErrObject(STATUS_CODE.NOT_FOUND, 'Job not found'),
      )
    }

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: {
        data: job,
        hasApplied,
        isSaved,
      },
    })
  } catch (error) {
    console.log(error)
    handleError(res, error)
  }
}

export { getJob }
