import pool from '../config/mysql.js'
import { buildErrObject } from '../utils/buildErrObject.js'

class Job {
  // Create a new job
  static async create(jobData) {
    const {
      company_id,
      title,
      job_responsibilities,
      requirements,
      benefits,
      salary_range,
      application_deadline,
      position_type,
      class_level,
      workplace_type,
    } = jobData

    const [result] = await pool.query(
      `INSERT INTO job
       (company_id, title, job_responsibilities, requirements, benefits,
        salary_range, application_deadline, position_type, class_level, workplace_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_id,
        title,
        job_responsibilities,
        requirements,
        benefits,
        salary_range,
        application_deadline,
        position_type,
        class_level,
        workplace_type,
      ],
    )

    return {
      job_id: result.insertId,
      ...jobData,
    }
  }

  // Get all jobs with company info and skills
  static async findAll(filters = {}, limit = 10, offset = 0) {
    const { position_type, workplace_type, search, location } = filters

    let query = `
      SELECT 
        j.job_id,
        j.about_role,
        j.title,
        j.salary_range,
        j.created_at,
        j.application_deadline,
        j.position_type,
        j.class_level,
        j.workplace_type,
        j.job_responsibilities,
        a.state,
        a.city,
        c.company_id,
        c.name as company_name,
        c.industry,
        GROUP_CONCAT(DISTINCT js.skill_name) as skills,
        DATEDIFF(NOW(), j.created_at) as days_ago
      FROM job j
      INNER JOIN company c ON j.company_id = c.company_id
      LEFT JOIN company_address ca ON c.company_id = ca.company_id
      LEFT JOIN address a ON ca.address_id = a.address_id
      LEFT JOIN job_skills js ON j.job_id = js.job_id
      WHERE 1=1
    `

    const params = []

    if (position_type) {
      query += ' AND j.position_type = ?'
      params.push(position_type)
    }

    if (workplace_type) {
      query += ' AND j.workplace_type = ?'
      params.push(workplace_type)
    }

    if (location) {
      query += ' AND a.state = ?'
      params.push(location)
    }

    if (search) {
      query += ' AND (j.title LIKE ? OR c.name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    query += `
      GROUP BY j.job_id, j.title, j.salary_range, j.created_at,
               j.application_deadline, j.position_type, j.class_level,
               j.workplace_type, j.job_responsibilities,
               c.company_id, c.name, c.industry, a.state , a.city
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
    `

    params.push(limit, offset)

    const [rows] = await pool.query(query, params)

    return rows.map((row) => ({
      ...row,
      skills: row.skills ? row.skills.split(',') : [],
    }))
  }

  // Get total count for pagination
  static async getCount(filters = {}) {
    const { position_type, workplace_type, search, location } = filters

    let query = `
      SELECT COUNT(DISTINCT j.job_id) as total
      FROM job j
      INNER JOIN company c ON j.company_id = c.company_id
      LEFT JOIN company_address ca ON c.company_id = ca.company_id
      LEFT JOIN address a ON ca.address_id = a.address_id
      WHERE 1=1
    `

    const params = []

    if (position_type) {
      query += ' AND j.position_type = ?'
      params.push(position_type)
    }

    if (workplace_type) {
      query += ' AND j.workplace_type = ?'
      params.push(workplace_type)
    }

    if (location) {
      query += ' AND a.state = ?'
      params.push(location)
    }

    if (search) {
      query += ' AND (j.title LIKE ? OR c.name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    const [rows] = await pool.query(query, params)
    return rows[0].total
  }

  // Get job by ID with full details
  static async findById(job_id) {
    const query = `
    SELECT 
      j.*,
      c.company_id,
      c.name AS company_name,
      c.overview AS company_overview,
      c.industry,
      c.company_size,
      a.state ,
      a.city,
      GROUP_CONCAT(DISTINCT js.skill_name) AS skills,
      DATEDIFF(NOW(), j.created_at) AS days_ago
    FROM job j
    INNER JOIN company c ON j.company_id = c.company_id
    LEFT JOIN company_address ca ON c.company_id = ca.company_id
    LEFT JOIN address a ON ca.address_id = a.address_id
    LEFT JOIN job_skills js ON j.job_id = js.job_id
    WHERE j.job_id = ?
    GROUP BY j.job_id , a.state,a.city
  `

    const [rows] = await pool.query(query, [job_id])
    if (rows.length === 0) return null

    const job = rows[0]
    return {
      ...job,
      skills: job.skills ? job.skills.split(',') : [],
    }
  }

  // Update job
  static async update(job_id, updates) {
    const allowedFields = [
      'title',
      'job_responsibilities',
      'requirements',
      'benefits',
      'salary_range',
      'application_deadline',
      'position_type',
      'class_level',
      'workplace_type',
    ]

    const fields = []
    const values = []

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(updates[key])
      }
    })

    if (fields.length === 0) throw new Error('No valid fields to update')

    values.push(job_id)

    const [result] = await pool.query(
      `UPDATE job SET ${fields.join(', ')} WHERE job_id = ?`,
      values,
    )

    return result.affectedRows > 0
  }

  // Delete job
  static async delete(job_id) {
    const [result] = await pool.query('DELETE FROM job WHERE job_id = ?', [
      job_id,
    ])
    return result.affectedRows > 0
  }

  // Get jobs by company
  static async findByCompany(company_id, limit = 10, offset = 0) {
    const query = `
      SELECT 
        j.*,
        c.name as company_name,
        GROUP_CONCAT(DISTINCT js.skill_name) as skills
      FROM job j
      INNER JOIN company c ON j.company_id = c.company_id
      LEFT JOIN job_skills js ON j.job_id = js.job_id
      WHERE j.company_id = ?
      GROUP BY j.job_id
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
    `
    const [rows] = await pool.query(query, [company_id, limit, offset])
    return rows.map((row) => ({
      ...row,
      skills: row.skills ? row.skills.split(',') : [],
    }))
  }

  // Search jobs
  static async search(searchTerm, limit = 10) {
    const query = `
      SELECT 
        j.job_id,
        j.title,
        j.salary_range,
        j.position_type,
        j.workplace_type,
        c.name as company_name,
        c.industry,
        GROUP_CONCAT(DISTINCT js.skill_name) as skills
      FROM job j
      INNER JOIN company c ON j.company_id = c.company_id
      LEFT JOIN job_skills js ON j.job_id = js.job_id
      WHERE j.title LIKE ? OR c.name LIKE ? OR js.skill_name LIKE ?
      GROUP BY j.job_id
      LIMIT ?
    `
    const [rows] = await pool.query(query, [
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      limit,
    ])
    return rows.map((row) => ({
      ...row,
      skills: row.skills ? row.skills.split(',') : [],
    }))
  }

  // Add skill to job
  static async addSkill(job_id, skill_name) {
    try {
      await pool.query(
        'INSERT INTO job_skills (job_id, skill_name) VALUES (?, ?)',
        [job_id, skill_name],
      )
      return true
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw buildErrObject(409, 'Skill already added to this job')
      }
      throw error
    }
  }

  // Remove skill from job
  static async removeSkill(job_id, skill_name) {
    const [result] = await pool.query(
      'DELETE FROM job_skills WHERE job_id = ? AND skill_name = ?',
      [job_id, skill_name],
    )
    return result.affectedRows > 0
  }

  // Get active jobs (not past deadline)
  static async getActiveJobs(limit = 10, offset = 0) {
    const query = `
      SELECT 
        j.*,
        c.name as company_name,
        GROUP_CONCAT(DISTINCT js.skill_name) as skills
      FROM job j
      INNER JOIN company c ON j.company_id = c.company_id
      LEFT JOIN job_skills js ON j.job_id = js.job_id
      WHERE j.application_deadline >= CURDATE() OR j.application_deadline IS NULL
      GROUP BY j.job_id
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
    `
    const [rows] = await pool.query(query, [limit, offset])
    return rows.map((row) => ({
      ...row,
      skills: row.skills ? row.skills.split(',') : [],
    }))
  }
}

export default Job
