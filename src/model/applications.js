import pool from '../config/mysql.js'
import { buildErrObject } from '../utils/buildErrObject.js'

class Application {
  // Apply for a job
  static async applyForJob(user_id, job_id) {
    try {
      const [resultSets] = await pool.query(`CALL ApplyForJob(?, ?)`, [
        user_id,
        job_id,
      ])

      const row = resultSets[0][0]

      return row
    } catch (err) {
      if (err.sqlState === '45000') {
        throw buildErrObject(400, err.message)
      }

      // Unexpected errors
      throw buildErrObject(500, err.message)
    }
  }

  // Check if already applied
  static async hasApplied(user_id, job_id) {
    const [rows] = await pool.query(
      `SELECT application_id FROM application 
       WHERE user_id = ? AND job_id = ? 
       LIMIT 1`,
      [user_id, job_id],
    )
    return rows.length > 0
  }

  // Get all applications for a user
  static async getUserApplications(user_id, status = null) {
    const [resultSets] = await pool.query(`CALL GetUserApplications(?, ?)`, [
      user_id,
      status,
    ])

    // First result set
    return resultSets[0]
  }

  // Withdraw application
  static async withdrawApplication(application_id, user_id) {
    try {
      await pool.query(`CALL WithdrawApplication(?, ?)`, [
        application_id,
        user_id,
      ])
      return true
    } catch (err) {
      if (err.sqlState === '45000') {
        throw buildErrObject(404, err.message)
      }
      throw buildErrObject(500, err.message)
    }
  }

  // Save a job
  static async saveJob(user_id, job_id) {
    try {
      const [resultSets] = await pool.query(`CALL SaveJob(?, ?)`, [
        user_id,
        job_id,
      ])

      // First result set contains the inserted saved job
      return resultSets[0][0]
    } catch (err) {
      if (err.sqlState === '45000') {
        throw buildErrObject(400, err.message)
      }
      throw buildErrObject(500, err.message)
    }
  }

  // Unsave a job
  static async unsaveJob(user_id, job_id) {
    try {
      await pool.query(`CALL UnsaveJob(?, ?)`, [user_id, job_id])
      return true
    } catch (err) {
      if (err.sqlState === '45000') {
        throw buildErrObject(404, err.message)
      }
      throw buildErrObject(500, err.message)
    }
  }

  // Check if job is saved
  static async isJobSaved(user_id, job_id) {
    const [rows] = await pool.query(
      `SELECT saved_job_id FROM saved_jobs 
       WHERE user_id = ? AND job_id = ? 
       LIMIT 1`,
      [user_id, job_id],
    )
    return rows.length > 0
  }

  // Get all saved jobs for user
  static async getSavedJobs(user_id) {
    const [resultSets] = await pool.query(`CALL GetSavedJobsByUser(?)`, [
      user_id,
    ])

    return resultSets[0]
  }

  // Get recent applications
  static async getRecentApplications(user_id, limit = 5) {
    const [resultSets] = await pool.query(
      `CALL GetRecentApplicationsByUser(?, ?)`,
      [user_id, limit],
    )

    // First result set
    return resultSets[0]
  }

  static async getApplicationCount(user_id) {
    const [resultSets] = await pool.query(
      `CALL GetApplicationCountsByUser(?)`,
      [user_id],
    )

    // First result set
    const counts = resultSets[0][0]

    return {
      totalCount: counts.totalCount,
      acceptedCount: counts.acceptedCount,
      rejectedCount: counts.rejectedCount,
    }
  }
}

export default Application
