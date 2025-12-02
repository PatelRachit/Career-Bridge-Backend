import pool from '../config/mysql.js'
import { buildErrObject } from '../utils/buildErrObject.js'
import bcrypt from 'bcrypt'

class Recruiter {
  // Create a new recruiter with user, company, and address
  static async createCompany(data) {
    const {
      first_name,
      last_name,
      phone_number,
      email,
      password,
      company_name,
      overview,
      industry,
      company_size,
      street,
      city,
      county,
      state,
      country,
    } = data

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
      const [resultSets] = await pool.query(
        `CALL CreateCompany(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          first_name,
          last_name,
          phone_number,
          email,
          hashedPassword,
          company_name,
          overview,
          industry,
          company_size,
          street,
          city,
          county,
          state,
          country,
        ],
      )

      return resultSets[0][0]
    } catch (err) {
      if (err.sqlState === '45000') {
        throw buildErrObject(400, err.message)
      }
      throw buildErrObject(500, err.message)
    }
  }

  // Get jobs by recruiter
  static async getJobsByCompany(recruiterId) {
    try {
      const [resultSets] = await pool.query(`CALL GetJobsByCompany(?)`, [
        recruiterId,
      ])

      // First result set: jobs with application counts
      const jobs = resultSets[0]

      // Second result set: total pending applications
      const totalCount = resultSets[1][0].total_count

      return { data: jobs, totalCount }
    } catch (err) {
      if (err.sqlState === '45000') {
        throw buildErrObject(404, err.message)
      }
      throw buildErrObject(500, err.message)
    }
  }

  static async getApplicantById(applicantId) {
    const [rows] = await pool.query('CALL get_applicant_by_id(?)', [
      applicantId,
    ])

    return rows[0]
  }

  static async getApplicantsByJob(job_id, status) {
    const [resultSets] = await pool.query(`CALL GetApplicantsByJob(?, ?)`, [
      job_id,
      status,
    ])

    // First result set: job info
    const jobRow = resultSets[0][0]
    if (!jobRow) throw buildErrObject(404, 'Job not found')

    const job = {
      job_id: jobRow.job_id,
      job_title: jobRow.job_title,
      company_name: jobRow.company_name,
      job_skills: jobRow.job_skills ? jobRow.job_skills.split(',') : [],
      created_at: jobRow.created_at,
    }

    // Second result set: applicants
    const applicants = resultSets[1].map((row) => ({
      ...row,
      skills: row.skills ? row.skills.split(',') : [],
    }))

    return {
      ...job,
      applicants,
    }
  }
  static async rejectApplication(job_id, user_id) {
    await pool.query('CALL reject_application(?, ?)', [job_id, user_id])
    return true
  }

  static async scheduleInterview(job_id, user_id) {
    const [result] = await pool.query('CALL schedule_interview(?, ?)', [
      job_id,
      user_id,
    ])

    const [[{ affected }]] = await pool.query('SELECT ROW_COUNT() AS affected')

    if (affected === 0) {
      throw buildErrObject(404, 'Application not found or unauthorized')
    }

    return true
  }

  static async getSkills() {
    const [rows] = await pool.query(`SELECT name FROM skills`)
    return rows
  }

  // Get all position types
  static async getPositionTypes() {
    const [rows] = await pool.query(`SELECT type FROM position_type`)
    return rows
  }

  // Get all class levels
  static async getClassLevels() {
    const [rows] = await pool.query(`SELECT name FROM class_level`)
    return rows
  }

  // Get all workplace types
  static async getWorkplaceTypes() {
    const [rows] = await pool.query(`SELECT type FROM workplace_type`)
    return rows
  }

  static async createJob(jobData, recruiter_id) {
    const {
      title,
      about_role,
      salaryRange,
      requirements,
      benefits,
      job_responsibilities,
      application_deadline,
      position_type,
      class_level,
      workplace_type,
      skills = [],
    } = jobData

    const [companyRows] = await pool.query(
      `SELECT company_id FROM recruiter WHERE user_id = ?`,
      [recruiter_id],
    )

    if (companyRows.length === 0) {
      throw buildErrObject(404, 'Recruiter not found')
    }

    const company_id = companyRows[0].company_id

    const skillsCSV = skills.join(',')

    const [rows] = await pool.query(
      `CALL create_job(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        about_role,
        salaryRange,
        requirements,
        benefits,
        job_responsibilities,
        new Date(application_deadline),
        position_type,
        class_level,
        workplace_type,
        company_id,
        skillsCSV,
      ],
    )

    return {
      job_id: rows[0][0].job_id,
      title,
      company_id,
      skills,
    }
  }
}

export default Recruiter
