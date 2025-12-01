import { STATUS_CODE } from '../../constant/statusCode.js'
import { handleError } from '../../utils/handleError.js'
import Job from '../../model/Job.js'

const getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      position_type,
      workplace_type,
      class_level,
      search,
      location,
    } = req.query

    const currentPage = Math.max(parseInt(page), 1)
    const perPage = Math.max(parseInt(limit), 1)
    const offset = (currentPage - 1) * perPage

    const filters = {}
    if (position_type) filters.position_type = position_type
    if (workplace_type) filters.workplace_type = workplace_type
    if (class_level) filters.class_level = class_level
    if (search) filters.search = search
    if (location) filters.location = location

    const [jobs, total] = await Promise.all([
      Job.findAll(filters, perPage, offset),
      Job.getCount(filters),
    ])

    const totalPages = Math.ceil(total / perPage)

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage,
          totalPages,
          totalJobs: total,
          limit: perPage,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
      },
    })
  } catch (error) {
    handleError(res, error)
  }
}

export { getAllJobs }
