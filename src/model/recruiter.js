import pool from '../config/mysql.js'
import { ERROR_CODE } from '../constant/errorCode.js'
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

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Check if user exists
      const [existingUser] = await connection.query(
        `SELECT user_id FROM user WHERE email = ? LIMIT 1`,
        [email],
      )
      if (existingUser.length > 0)
        throw buildErrObject(400, ERROR_CODE.EMAIL_ALREADY_EXISTS)

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user (isAdmin=true)
      const [userResult] = await connection.query(
        `INSERT INTO user (first_name, last_name, phone_number, email, password, is_admin)
         VALUES (?, ?, ?, ?, ?, true)`,
        [first_name, last_name, phone_number, email, hashedPassword],
      )
      const userId = userResult.insertId

      // Check or create company
      let companyId
      const [existingCompany] = await connection.query(
        `SELECT company_id FROM company WHERE name = ? LIMIT 1`,
        [company_name],
      )
      if (existingCompany.length > 0) {
        companyId = existingCompany[0].company_id
      } else {
        const [companyResult] = await connection.query(
          `INSERT INTO company (name, overview, industry, company_size)
           VALUES (?, ?, ?, ?)`,
          [company_name, overview, industry, company_size],
        )
        companyId = companyResult.insertId

        // Create address
        const [addressResult] = await connection.query(
          `INSERT INTO address (street, city, county, state, country)
           VALUES (?, ?, ?, ?, ?)`,
          [street, city, county, state, country],
        )
        const addressId = addressResult.insertId

        // Link company and address
        await connection.query(
          `INSERT INTO company_address (company_id, address_id) VALUES (?, ?)`,
          [companyId, addressId],
        )
      }

      // Create recruiter link
      await connection.query(
        `INSERT INTO recruiter (user_id, company_id) VALUES (?, ?)`,
        [userId, companyId],
      )

      await connection.commit()
      return {
        userId,
        companyId,
        first_name,
        last_name,
        email,
        phone_number,
        company_name,
        isAdmin: true,
      }
    } catch (err) {
      await connection.rollback()
      throw buildErrObject(err.code ? err.code : 500, err.message)
    } finally {
      connection.release()
    }
  }

  // Get recruiter by user ID
  static async getRecruiterByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT 
        u.user_id, u.first_name, u.last_name, u.date_of_birth,
        u.phone_number, u.email, u.sex, u.isAdmin,
        c.company_id, c.name as company_name, c.overview, c.industry, c.company_size,
        a.address_id, a.street, a.city, a.county, a.state, a.country
      FROM recruiter r
      INNER JOIN user u ON r.user_id = u.user_id
      INNER JOIN company c ON r.company_id = c.company_id
      LEFT JOIN company_address ca ON c.company_id = ca.company_id
      LEFT JOIN address a ON ca.address_id = a.address_id
      WHERE r.user_id = ? LIMIT 1`,
      [userId],
    )
    return rows[0] || null
  }

  // Get recruiter by email
  static async getRecruiterByEmail(email) {
    const [rows] = await pool.query(
      `SELECT 
        u.user_id, u.first_name, u.last_name, u.date_of_birth,
        u.phone_number, u.email, u.password, u.sex, u.isAdmin,
        c.company_id, c.name as company_name, c.overview, c.industry, c.company_size,
        a.address_id, a.street, a.city, a.county, a.state, a.country
      FROM recruiter r
      INNER JOIN user u ON r.user_id = u.user_id
      INNER JOIN company c ON r.company_id = c.company_id
      LEFT JOIN company_address ca ON c.company_id = ca.company_id
      LEFT JOIN address a ON ca.address_id = a.address_id
      WHERE u.email = ? LIMIT 1`,
      [email],
    )
    return rows[0] || null
  }

  // Get all recruiters for a company
  static async getRecruitersByCompany(companyId) {
    const [rows] = await pool.query(
      `SELECT 
        u.user_id, u.first_name, u.last_name, u.phone_number, u.email, u.isAdmin,
        c.company_id, c.name as company_name
      FROM recruiter r
      INNER JOIN user u ON r.user_id = u.user_id
      INNER JOIN company c ON r.company_id = c.company_id
      WHERE r.company_id = ?
      ORDER BY u.last_name, u.first_name`,
      [companyId],
    )
    return rows
  }

  // Update recruiter user info
  static async updateRecruiterUser(userId, data) {
    const {
      first_name,
      last_name,
      date_of_birth,
      phone_number,
      email,
      sex,
      password,
    } = data
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      if (email || phone_number) {
        const [existing] = await connection.query(
          `SELECT user_id FROM user WHERE (email = ? OR phone_number = ?) AND user_id != ? LIMIT 1`,
          [email || '', phone_number || '', userId],
        )
        if (existing.length > 0)
          throw buildErrObject(
            400,
            'User with this email or phone already exists',
          )
      }

      const hashedPassword = password ? await bcrypt.hash(password, 10) : null

      const [result] = await connection.query(
        `UPDATE user SET
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          date_of_birth = COALESCE(?, date_of_birth),
          phone_number = COALESCE(?, phone_number),
          email = COALESCE(?, email),
          password = COALESCE(?, password),
          sex = COALESCE(?, sex)
        WHERE user_id = ?`,
        [
          first_name,
          last_name,
          date_of_birth,
          phone_number,
          email,
          hashedPassword,
          sex,
          userId,
        ],
      )

      if (result.affectedRows === 0) throw buildErrObject(404, 'User not found')

      await connection.commit()
      return await this.getRecruiterByUserId(userId)
    } catch (err) {
      await connection.rollback()
      throw buildErrObject(err.code ? err.code : 500, err.message)
    } finally {
      connection.release()
    }
  }

  // Update recruiter's company
  static async updateRecruiterCompany(userId, companyId) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const [companyExists] = await connection.query(
        `SELECT company_id FROM company WHERE company_id = ? LIMIT 1`,
        [companyId],
      )
      if (companyExists.length === 0)
        throw buildErrObject(404, 'Company not found')

      const [result] = await connection.query(
        `UPDATE recruiter SET company_id = ? WHERE user_id = ?`,
        [companyId, userId],
      )
      if (result.affectedRows === 0)
        throw buildErrObject(404, 'Recruiter not found')

      await connection.commit()
      return await this.getRecruiterByUserId(userId)
    } catch (err) {
      await connection.rollback()
      throw buildErrObject(err.code ? err.code : 500, err.message)
    } finally {
      connection.release()
    }
  }

  // Delete recruiter
  static async deleteRecruiter(userId) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const [recruiterResult] = await connection.query(
        `DELETE FROM recruiter WHERE user_id = ?`,
        [userId],
      )
      if (recruiterResult.affectedRows === 0)
        throw buildErrObject(404, 'Recruiter not found')

      await connection.query(`DELETE FROM user WHERE user_id = ?`, [userId])
      await connection.commit()
      return true
    } catch (err) {
      await connection.rollback()
      throw buildErrObject(err.code ? err.code : 500, err.message)
    } finally {
      connection.release()
    }
  }

  // Get jobs by recruiter
  static async getJobsByCompany(recruiterId) {
    const [company] = await pool.query(
      `SELECT * FROM recruiter WHERE user_id = ?`,
      [recruiterId],
    )
    if (!company[0]) throw buildErrObject(404, 'Recruiter not found')

    // Get all jobs with application count per job
    const [rows] = await pool.query(
      `SELECT
        j.job_id,
        j.title,
        j.created_at,
        j.application_deadline,
        j.position_type,
        c.company_id,
        c.name AS company_name,
        c.industry,
        COUNT(DISTINCT app.application_id) AS application_count
     FROM recruiter r
     INNER JOIN company c ON r.company_id = c.company_id
     INNER JOIN job j ON j.company_id = c.company_id
     LEFT JOIN application app ON app.job_id = j.job_id AND app.status = 'pending'
     WHERE c.company_id = ?
     GROUP BY j.job_id, j.title, j.created_at, j.application_deadline, j.position_type, c.company_id, c.name, c.industry
     ORDER BY j.created_at DESC`,
      [company[0].company_id],
    )

    // Calculate total applications separately
    const [totalApplications] = await pool.query(
      `SELECT COUNT(*) AS total_count
     FROM application app
     INNER JOIN job j ON app.job_id = j.job_id
     WHERE j.company_id = ? and app.status = "pending"`,
      [company[0].company_id],
    )

    return { data: rows, totalCount: totalApplications[0].total_count }
  }

  // Get all recruiters
  static async getAllRecruiters() {
    const [rows] = await pool.query(
      `SELECT
        u.user_id, u.first_name, u.last_name, u.phone_number, u.email, u.date_of_birth, u.isAdmin,
        c.company_id, c.name as company_name, c.industry
      FROM recruiter r
      INNER JOIN user u ON r.user_id = u.user_id
      INNER JOIN company c ON r.company_id = c.company_id
      ORDER BY u.last_name, u.first_name`,
    )
    return rows
  }

  // Check if user is a recruiter
  static async isRecruiter(userId) {
    const [rows] = await pool.query(
      `SELECT user_id FROM recruiter WHERE user_id = ? LIMIT 1`,
      [userId],
    )
    return rows.length > 0
  }

  // Get recruiter count
  static async getRecruiterCount() {
    const [rows] = await pool.query(`SELECT COUNT(*) as count FROM recruiter`)
    return rows[0].count
  }

  // Search recruiters
  static async searchRecruiters(searchTerm) {
    const [rows] = await pool.query(
      `SELECT 
        u.user_id, u.first_name, u.last_name, u.phone_number, u.email, u.isAdmin,
        c.company_id, c.name as company_name, c.industry
      FROM recruiter r
      INNER JOIN user u ON r.user_id = u.user_id
      INNER JOIN company c ON r.company_id = c.company_id
      WHERE u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR c.name LIKE ?
      ORDER BY u.last_name, u.first_name`,
      [
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
      ],
    )
    return rows
  }

  // Verify recruiter password for login
  static async verifyRecruiterPassword(email, password) {
    const recruiter = await this.getRecruiterByEmail(email)
    if (!recruiter) return null

    const isValid = await bcrypt.compare(password, recruiter.password)
    if (!isValid) return null

    delete recruiter.password
    return recruiter
  }

  static async getApplicantById(applicantId) {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.first_name, u.email 
     FROM user u
     INNER JOIN applicant a ON a.user_id = u.user_id
     WHERE u.user_id = ?`,
      [applicantId],
    )
    return rows
  }

  static async getApplicantsByJob(job_id) {
    const [jobRows] = await pool.query(
      `SELECT 
        j.title,
        j.created_at,
        c.name AS company_name,
        GROUP_CONCAT(js.skill_name) AS job_skills
     FROM job j
     INNER JOIN company c ON c.company_id = j.company_id
     LEFT JOIN job_skills js ON js.job_id = j.job_id
     WHERE j.job_id = ?
     GROUP BY j.job_id, j.created_at, c.name`,
      [job_id],
    )

    if (jobRows.length === 0) {
      return res.status(404).json({ message: 'Job not found' })
    }

    const job = {
      title: jobRows[0].title,
      company_name: jobRows[0].company_name,
      skills: jobRows[0].job_skills ? jobRows[0].job_skills.split(',') : [],
      created_at: jobRows[0].created_at,
    }
    // Fetch applicants for this job along with their skills
    const [applicantRows] = await pool.query(
      `SELECT 
          u.user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          a.resume_link,
          app.application_id,
          app.status,
          app.applied_date,
          GROUP_CONCAT(s.skill_name) AS skills
       FROM application app
       INNER JOIN user u ON u.user_id = app.user_id
       LEFT JOIN applicant a ON a.user_id = u.user_id
       LEFT JOIN applicant_skills s ON s.user_id = u.user_id
       WHERE app.job_id = ? AND app.status = "pending"
       GROUP BY u.user_id, a.resume_link, app.application_id, app.status, app.applied_date`,
      [job_id],
    )
    const applicants = applicantRows.map((row) => ({
      ...row,
      skills: row.skills ? row.skills.split(',') : [],
    }))

    return {
      job_id,
      job_title: job.title,
      company_name: job.company_name,
      job_skills: job.skills,
      created_at: job.created_at,
      applicants,
    }
  }

  static async rejectApplication(job_id, user_id) {
    const [result] = await pool.query(
      `UPDATE application
       SET status = 'rejected'
       WHERE job_id = ? AND user_id = ?`,
      [job_id, user_id],
    )

    if (result.affectedRows === 0) {
      throw buildErrObject(404, 'Application not found or unauthorized')
    }

    return true
  }

  static async scheduleInterview(job_id, user_id) {
    const [result] = await pool.query(
      `UPDATE application
       SET status = 'interview'
       WHERE job_id = ? AND user_id = ?`,
      [job_id, user_id],
    )

    if (result.affectedRows === 0) {
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

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      // Fetch company_id for this recruiter
      const [companyRows] = await conn.query(
        `SELECT company_id FROM recruiter WHERE user_id = ?`,
        [recruiter_id],
      )

      if (companyRows.length === 0) {
        throw buildErrObject(
          404,
          'Recruiter not found or not associated with any company',
        )
      }

      const company_id = companyRows[0].company_id

      // Insert into job table
      const [result] = await conn.query(
        `INSERT INTO job
          (title, about_role, salary_range, requirements, benefits, job_responsibilities, application_deadline, position_type, class_level, workplace_type, company_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        ],
      )

      const job_id = result.insertId

      // Insert skills into job_skills junction table
      if (skills.length > 0) {
        const skillValues = skills.map((skill) => [job_id, skill])
        await conn.query(
          `INSERT INTO job_skills (job_id, skill_name) VALUES ?`,
          [skillValues],
        )
      }

      await conn.commit()
      return { job_id, title, company_id, skills }
    } catch (err) {
      await conn.rollback()
      console.log(err)
      throw buildErrObject(500, 'Failed to create job')
    } finally {
      conn.release()
    }
  }
}

export default Recruiter
