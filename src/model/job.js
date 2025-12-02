import pool from '../config/mysql.js'
import { STATUS_CODE } from '../constant/statusCode.js'
import { buildErrObject } from '../utils/buildErrObject.js'

class Job {
  static async findAllJobs(filters = {}, limit = 10, offset = 0) {
    try {
      const { position_type, workplace_type, search, location } = filters

      const [rows] = await pool.query(`call GetAllJobs(?, ?, ?, ?, ?, ?)`, [
        position_type,
        workplace_type,
        search,
        location,
        limit,
        offset,
      ])

      return rows[0].map((row) => ({
        ...row,
        skills: row.skills ? row.skills.split(',') : [],
      }))
    } catch (error) {
      buildErrObject(STATUS_CODE.BAD_REQUEST, 'Database error')
    }
  }

  // Get total count for pagination
  static async getCount(filters = {}) {
    const { position_type, workplace_type, search, location } = filters

    try {
      const [rows] = await pool.query(`call GetJobsCount(?, ?, ?, ?)`, [
        position_type,
        workplace_type,
        search,
        location,
      ])

      return rows[0][0].total
    } catch (error) {
      console.log(error)
    }
  }

  // Get job by ID with full details
  static async findById(job_id) {
    const [rows] = await pool.query(`call GetJobById(?)`, [job_id])

    if (rows.length === 0) return null

    const job = rows[0][0]
    return {
      ...job,
      skills: job.skills ? job.skills.split(',') : [],
    }
  }

  static async search(searchTerm, limit = 10) {
    const [rows] = await pool.query(`CALL SearchJobs(?, ?)`, [
      searchTerm,
      limit,
    ])

    const results = rows[0]

    return results.map((row) => ({
      ...row,
      skills: row.skills ? row.skills.split(',') : [],
    }))
  }
}

export default Job
