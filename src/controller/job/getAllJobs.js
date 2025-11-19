import { STATUS_CODE } from '../../constant/statusCode.js'
import { handleError } from '../../utils/handleError.js'
import Job from '../../model/Job.js'

const getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query

    const offset = (parseInt(page) - 1) * parseInt(limit)

    const [jobs, total] = await Promise.all([
      Job.findAll({}, parseInt(limit), offset),
      Job.getCount({}),
    ])

    const totalPages = Math.ceil(total / parseInt(limit))

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalJobs: total,
          limit: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    })
  } catch (error) {
    handleError(res, error)
  }
}

export { getAllJobs }
