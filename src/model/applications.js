import pool from '../config/mysql.js'
import { buildErrObject } from '../utils/buildErrObject.js'

class Application {
  // Apply for a job
  static async applyForJob(user_id, job_id) {
    try {
      // Check if already applied
      const [existing] = await pool.query(
        `SELECT application_id FROM application 
         WHERE user_id = ? AND job_id = ? 
         LIMIT 1`,
        [user_id, job_id],
      )

      if (existing.length > 0) {
        throw buildErrObject(400, 'You have already applied for this job')
      }

      // Create application
      const [result] = await pool.query(
        `INSERT INTO application 
         (user_id, job_id, status, applied_date)
         VALUES (?, ?, 'pending', NOW())`,
        [user_id, job_id],
      )

      return {
        application_id: result.insertId,
        user_id,
        job_id,
        status: 'pending',
        applied_date: new Date(),
      }
    } catch (error) {
      if (error.code && error.message) throw error
      throw buildErrObject(500, error.message)
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
    let query = `
      SELECT 
        a.application_id,
        a.status,
        a.applied_date,
        j.job_id,
        j.title as job_title,
        j.position_type,
        j.workplace_type,
        j.salary_range,
        j.application_deadline,
        c.name as company_name,
        c.industry,
        addr.state,
        addr.city
      FROM application a
      INNER JOIN job j ON a.job_id = j.job_id
      INNER JOIN company c ON j.company_id = c.company_id
      LEFT JOIN company_address ca ON c.company_id = ca.company_id
      LEFT JOIN address addr ON ca.address_id = addr.address_id
      WHERE a.user_id = ?
    `
    const params = [user_id]

    if (status) {
      query += ' AND a.status = ?'
      params.push(status)
    }

    query += ' ORDER BY a.applied_date DESC'

    const [rows] = await pool.query(query, params)
    return rows
  }

  // Get application by ID
  static async getApplicationById(application_id) {
    const [rows] = await pool.query(
      `SELECT 
        a.*,
        j.title as job_title,
        j.job_responsibilities,
        j.position_type,
        j.workplace_type,
        j.salary_range,
        c.name as company_name,
        c.overview as company_overview,
        addr.state,
        addr.city
      FROM application a
      INNER JOIN job j ON a.job_id = j.job_id
      INNER JOIN company c ON j.company_id = c.company_id
      LEFT JOIN company_address ca ON c.company_id = ca.company_id
      LEFT JOIN address addr ON ca.address_id = addr.address_id
      WHERE a.application_id = ?
      LIMIT 1`,
      [application_id],
    )
    return rows[0] || null
  }

  // Update application status
  static async updateStatus(application_id, newStatus) {
    const validStatuses = [
      'pending',
      'under review',
      'interview',
      'offer',
      'rejected',
      'withdrawn',
    ]

    if (!validStatuses.includes(newStatus.toLowerCase())) {
      throw buildErrObject(400, 'Invalid application status')
    }

    const [result] = await pool.query(
      `UPDATE application 
       SET status = ?, applied_date = NOW()
       WHERE application_id = ?`,
      [newStatus, application_id],
    )

    return result.affectedRows > 0
  }

  // Withdraw application
  static async withdrawApplication(application_id, user_id) {
    const [result] = await pool.query(
      `DELETE FROM application 
     WHERE application_id = ? AND user_id = ?`,
      [application_id, user_id],
    )

    if (result.affectedRows === 0) {
      throw buildErrObject(404, 'Application not found or unauthorized')
    }

    return true
  }

  // Delete application
  static async deleteApplication(application_id, user_id) {
    const [result] = await pool.query(
      `DELETE FROM application 
       WHERE application_id = ? AND user_id = ?`,
      [application_id, user_id],
    )

    if (result.affectedRows === 0) {
      throw buildErrObject(404, 'Application not found or unauthorized')
    }

    return true
  }

  // Get application statistics for user
  static async getUserStats(user_id) {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_applications,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'under review' THEN 1 ELSE 0 END) as under_review,
        SUM(CASE WHEN status = 'interview' THEN 1 ELSE 0 END) as interview,
        SUM(CASE WHEN status = 'offer' THEN 1 ELSE 0 END) as offers,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'withdrawn' THEN 1 ELSE 0 END) as withdrawn
      FROM application
      WHERE user_id = ?`,
      [user_id],
    )
    return stats[0]
  }

  // Save a job
  static async saveJob(user_id, job_id) {
    try {
      const [existing] = await pool.query(
        `SELECT saved_job_id FROM saved_jobs 
         WHERE user_id = ? AND job_id = ? 
         LIMIT 1`,
        [user_id, job_id],
      )

      if (existing.length > 0) {
        throw buildErrObject(400, 'Job already saved')
      }

      const [result] = await pool.query(
        `INSERT INTO saved_jobs (user_id, job_id)
         VALUES (?, ?)`,
        [user_id, job_id],
      )

      return {
        saved_job_id: result.insertId,
        user_id,
        job_id,
        saved_date: new Date(),
      }
    } catch (error) {
      if (error.code && error.message) throw error
      throw buildErrObject(500, error.message)
    }
  }

  // Unsave a job
  static async unsaveJob(user_id, job_id) {
    const [result] = await pool.query(
      `DELETE FROM saved_jobs 
       WHERE user_id = ? AND job_id = ?`,
      [user_id, job_id],
    )

    if (result.affectedRows === 0) {
      throw buildErrObject(404, 'Saved job not found')
    }

    return true
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
    const [rows] = await pool.query(
      `SELECT 
        sj.saved_job_id,
        j.job_id,
        j.title as job_title,
        j.position_type,
        j.workplace_type,
        j.salary_range,
        j.application_deadline,
        j.created_at,
        c.name as company_name,
        c.industry,
        addr.state,
        addr.city,
        DATEDIFF(NOW(), j.created_at) as days_ago
      FROM saved_jobs sj
      INNER JOIN job j ON sj.job_id = j.job_id
      INNER JOIN company c ON j.company_id = c.company_id
      LEFT JOIN company_address ca ON c.company_id = ca.company_id
      LEFT JOIN address addr ON ca.address_id = addr.address_id
      WHERE sj.user_id = ?`,
      [user_id],
    )
    return rows
  }

  // Get applications for a specific job
  static async getJobApplications(job_id, status = null) {
    let query = `
      SELECT 
        a.application_id,
        a.status,
        a.applied_date,
        a.updated_at,
        ap.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        ap.resume_link
      FROM application a
      INNER JOIN applicant ap ON a.user_id = ap.user_id
      INNER JOIN user u ON ap.user_id = u.user_id
      WHERE a.job_id = ?
    `
    const params = [job_id]

    if (status) {
      query += ' AND a.status = ?'
      params.push(status)
    }

    query += ' ORDER BY a.applied_date DESC'

    const [rows] = await pool.query(query, params)
    return rows
  }

  // Get recent applications
  static async getRecentApplications(user_id, limit = 5) {
    const [rows] = await pool.query(
      `SELECT 
        a.application_id,
        a.status,
        a.applied_date,
        j.job_id,
        j.title as job_title,
        c.name as company_name
      FROM application a
      INNER JOIN job j ON a.job_id = j.job_id
      INNER JOIN company c ON j.company_id = c.company_id
      WHERE a.user_id = ?
      ORDER BY a.applied_date DESC
      LIMIT ?`,
      [user_id, limit],
    )
    return rows
  }

  // Search applications
  static async searchApplications(user_id, searchTerm) {
    const [rows] = await pool.query(
      `SELECT 
        a.application_id,
        a.status,
        a.applied_date,
        j.job_id,
        j.title as job_title,
        j.position_type,
        c.name as company_name
      FROM application a
      INNER JOIN job j ON a.job_id = j.job_id
      INNER JOIN company c ON j.company_id = c.company_id
      WHERE a.user_id = ? 
      AND (j.title LIKE ? OR c.name LIKE ?)
      ORDER BY a.applied_date DESC`,
      [user_id, `%${searchTerm}%`, `%${searchTerm}%`],
    )
    return rows
  }

  // Get application counts
  static async getApplicationCount(user_id) {
    const [totalApplications] = await pool.query(
      `SELECT COUNT(*) as application_count FROM application WHERE user_id = ?`,
      [user_id],
    )

    const [acceptedApplications] = await pool.query(
      `SELECT COUNT(*) as application_count FROM application WHERE status = 'offer' AND user_id = ?`,
      [user_id],
    )

    const [rejectedApplications] = await pool.query(
      `SELECT COUNT(*) as application_count FROM application WHERE status = 'rejected' AND user_id = ?`,
      [user_id],
    )

    return {
      totalCount: totalApplications[0].application_count,
      acceptedCount: acceptedApplications[0].application_count,
      rejectedCount: rejectedApplications[0].application_count,
    }
  }
}

export default Application
