import { STATUS_CODE } from '../../constant/index.js'
import Job from '../../model/Job.js'
import { buildErrObject, handleError } from '../../utils/index.js'

const getJob = async (req, res) => {
  try {
    const { id } = req.params
    console.log(id)
    const job = await Job.findById(id)

    if (!job) {
      handleError(res, buildErrObject(STATUS_CODE.NOT_FOUND, NOT_FOUND))
    }

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: { job },
    })
  } catch (error) {
    console.log(error)
    handleError(res, error)
  }
}

export { getJob }
