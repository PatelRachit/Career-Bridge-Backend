import { STATUS_CODE } from '../../constant/index.js'
import Job from '../../model/Job.js'
import { buildErrObject, handleError } from '../../utils/index.js'

export const searchJobs = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query

    if (!q) {
      return handleError(res, buildErrObject(STATUS_CODE.NOT_FOUND, NOT_FOUND))
    }

    const jobs = await Job.search(q, parseInt(limit))

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: { jobs },
    })
  } catch (error) {
    handleError(res, error)
  }
}
