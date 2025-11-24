import pool from '../config/mysql.js'
import { buildErrObject } from '../utils/buildErrObject.js'

class Application {
  // Apply for a job
  static async applyForJob(applicantId, jobId) {
    try {
      // Check if already applied
      const [existing] = await pool.query(
        `SELECT application_id FROM Application 
         WHERE applicant_id = ? AND job_id = ? 
         LIMIT 1`,
        [applicantId, jobId],
      )

      if (existing.length > 0) {
        throw buildErrObject(400, 'You have already applied for this job')
      }

      // Create application
      const [result] = await pool.query(
        `INSERT INTO Application 
         (applicant_id, job_id, status, applied_date)
         VALUES (?, ?, 'Applied', NOW())`,
        [applicantId, jobId],
      )

      return {
        applicationId: result.insertId,
        applicantId,
        jobId,
        status: 'Applied',
        appliedDate: new Date(),
      }
    } catch (error) {
      if (error.code && error.message) {
        throw error
      }
      throw buildErrObject(500, error.message)
    }
  }

  // Check if already applied
  static async hasApplied(applicantId, jobId) {
    const [rows] = await pool.query(
      `SELECT application_id FROM Application 
       WHERE applicant_id = ? AND job_id = ? 
       LIMIT 1`,
      [applicantId, jobId],
    )
    return rows.length > 0
  }

  // Get all applications for an applicant
  static async getApplicantApplications(applicantId, status = null) {
    let query = `
      SELECT 
        a.application_id,
        a.status,
        a.applied_date,
        j.job_id,
        j.title as job_title,
        j.Position_Type,
        j.Workplace_Type,
        j.compensation,
        j.application_deadline,
        c.name,
        c.industry,
        addr.state,
        addr.city
      FROM Application a
      INNER JOIN Job j ON a.job_id = j.job_id
      INNER JOIN Company c ON j.company_id = c.company_id
      LEFT JOIN Address addr ON j.address_id = addr.address_id
      WHERE a.applicant_id = ?
    `

    const params = [applicantId]

    if (status) {
      query += ' AND a.application_status = ?'
      params.push(status)
    }

    query += ' ORDER BY a.applied_date DESC'

    const [rows] = await pool.query(query, params)
    return rows
  }

  // Get application by ID
  static async getApplicationById(applicationId) {
    const [rows] = await pool.query(
      `SELECT 
        a.*,
        j.title as job_title,
        j.about_role,
        j.Position_Type,
        j.Workplace_Type,
        j.compensation,
        c.company_name,
        c.company_overview,
        addr.state,
        addr.city
      FROM Application a
      INNER JOIN Job j ON a.job_id = j.job_id
      INNER JOIN Company c ON j.company_id = c.company_id
      LEFT JOIN Address addr ON j.address_id = addr.address_id
      WHERE a.application_id = ?
      LIMIT 1`,
      [applicationId],
    )
    return rows[0] || null
  }

  // Update application status
  static async updateStatus(applicationId, newStatus) {
    const validStatuses = [
      'Applied',
      'Under Review',
      'Interview',
      'Offer',
      'Rejected',
      'Withdrawn',
    ]

    if (!validStatuses.includes(newStatus)) {
      throw buildErrObject(400, 'Invalid application status')
    }

    const [result] = await pool.query(
      `UPDATE Application 
       SET application_status = ?, updated_at = NOW()
       WHERE application_id = ?`,
      [newStatus, applicationId],
    )

    return result.affectedRows > 0
  }

  // Withdraw application
  static async withdrawApplication(applicationId, applicantId) {
    const [result] = await pool.query(
      `UPDATE Application 
       SET status = 'Withdrawn'
       WHERE application_id = ? AND applicant_id = ?`,
      [applicationId, applicantId],
    )

    if (result.affectedRows === 0) {
      throw buildErrObject(404, 'Application not found or unauthorized')
    }

    return true
  }

  // Delete application
  static async deleteApplication(applicationId, applicantId) {
    const [result] = await pool.query(
      `DELETE FROM Application 
       WHERE application_id = ? AND applicant_id = ?`,
      [applicationId, applicantId],
    )

    if (result.affectedRows === 0) {
      throw buildErrObject(404, 'Application not found or unauthorized')
    }

    return true
  }

  // Get application statistics for applicant
  static async getApplicantStats(applicantId) {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_applications,
        SUM(CASE WHEN application_status = 'Applied' THEN 1 ELSE 0 END) as applied,
        SUM(CASE WHEN application_status = 'Under Review' THEN 1 ELSE 0 END) as under_review,
        SUM(CASE WHEN application_status = 'Interview' THEN 1 ELSE 0 END) as interview,
        SUM(CASE WHEN application_status = 'Offer' THEN 1 ELSE 0 END) as offers,
        SUM(CASE WHEN application_status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN application_status = 'Withdrawn' THEN 1 ELSE 0 END) as withdrawn
      FROM Application
      WHERE applicant_id = ?`,
      [applicantId],
    )
    return stats[0]
  }

  // Save a job (bookmark/favorite)
  static async saveJob(applicantId, jobId) {
    try {
      // Check if already saved
      const [existing] = await pool.query(
        `SELECT saved_job_id FROM Saved_Jobs 
         WHERE applicant_id = ? AND job_id = ? 
         LIMIT 1`,
        [applicantId, jobId],
      )

      if (existing.length > 0) {
        throw buildErrObject(400, 'Job already saved')
      }

      const [result] = await pool.query(
        `INSERT INTO Saved_Jobs (applicant_id, job_id)
         VALUES (?, ?)`,
        [applicantId, jobId],
      )

      return {
        savedJobId: result.insertId,
        applicantId,
        jobId,
        savedDate: new Date(),
      }
    } catch (error) {
      if (error.code && error.message) {
        throw error
      }
      throw buildErrObject(500, error.message)
    }
  }

  // Unsave a job
  static async unsaveJob(applicantId, jobId) {
    const [result] = await pool.query(
      `DELETE FROM Saved_Jobs 
       WHERE applicant_id = ? AND job_id = ?`,
      [applicantId, jobId],
    )

    if (result.affectedRows === 0) {
      throw buildErrObject(404, 'Saved job not found')
    }

    return true
  }

  // Check if job is saved
  static async isJobSaved(applicantId, jobId) {
    const [rows] = await pool.query(
      `SELECT saved_job_id FROM Saved_Jobs 
       WHERE applicant_id = ? AND job_id = ? 
       LIMIT 1`,
      [applicantId, jobId],
    )
    return rows.length > 0
  }

  // Get all saved jobs for applicant
  static async getSavedJobs(applicantId) {
    const [rows] = await pool.query(
      `SELECT 
        sj.saved_job_id,
        j.job_id,
        j.title as job_title,
        j.Position_Type,
        j.Workplace_Type,
        j.compensation,
        j.application_deadline,
        j.posted_date,
        c.name,
        c.industry,
        addr.state,
        addr.city,
        DATEDIFF(NOW(), j.posted_date) as days_ago
      FROM Saved_Jobs sj
      INNER JOIN Job j ON sj.job_id = j.job_id
      INNER JOIN Company c ON j.company_id = c.company_id
      LEFT JOIN Address addr ON j.address_id = addr.address_id
      WHERE sj.applicant_id = ?`,
      [applicantId],
    )
    return rows
  }

  // Get applications for a specific job (for recruiters/admins)
  static async getJobApplications(jobId, status = null) {
    let query = `
      SELECT 
        a.application_id,
        a.application_status,
        a.applied_date,
        a.updated_at,
        ap.applicant_id,
        ap.first_name,
        ap.last_name,
        ap.email,
        ap.phone_number,
        ap.resume_link
      FROM Application a
      INNER JOIN Applicant ap ON a.applicant_id = ap.applicant_id
      WHERE a.job_id = ?
    `

    const params = [jobId]

    if (status) {
      query += ' AND a.application_status = ?'
      params.push(status)
    }

    query += ' ORDER BY a.applied_date DESC'

    const [rows] = await pool.query(query, params)
    return rows
  }

  // Get recent applications (for dashboard)
  static async getRecentApplications(applicantId, limit = 5) {
    const [rows] = await pool.query(
      `SELECT 
        a.application_id,
        a.status,
        a.applied_date,
        j.job_id,
        j.title as job_title,
        c.name
      FROM Application a
      INNER JOIN Job j ON a.job_id = j.job_id
      INNER JOIN Company c ON j.company_id = c.company_id
      WHERE a.applicant_id = ?
      ORDER BY a.applied_date DESC
      LIMIT ?`,
      [applicantId, limit],
    )
    return rows
  }

  // Search applications
  static async searchApplications(applicantId, searchTerm) {
    const [rows] = await pool.query(
      `SELECT 
        a.application_id,
        a.application_status,
        a.applied_date,
        j.job_id,
        j.title as job_title,
        j.Position_Type,
        c.company_name
      FROM Application a
      INNER JOIN Job j ON a.job_id = j.job_id
      INNER JOIN Company c ON j.company_id = c.company_id
      WHERE a.applicant_id = ? 
      AND (j.title LIKE ? OR c.company_name LIKE ?)
      ORDER BY a.applied_date DESC`,
      [applicantId, `%${searchTerm}%`, `%${searchTerm}%`],
    )
    return rows
  }

  static async getApplicationCount(applicant_id) {
    const totalApplications = await pool.query(
      `SELECT COUNT(*) as application_count from Application a where applicant_id = ?`,
      [applicant_id],
    )

    const acceptedApplications = await pool.query(
      `SELECT COUNT(*) as application_count from Application a where status = "accepted" and applicant_id = ?`,
      [applicant_id],
    )

    const rejectedApplications = await pool.query(
      `SELECT COUNT(*) as application_count from Application a where status = "rejected" and applicant_id = ?`,
      [applicant_id],
    )

    return {
      totalCount: totalApplications[0][0],
      acceptedCount: acceptedApplications[0][0],
      rejectedCount: rejectedApplications[0][0],
    }
  }
}

export default Application
