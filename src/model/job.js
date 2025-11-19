import pool from '../config/mysql.js'
import { buildErrObject } from '../utils/buildErrObject.js'

class Job {
  // Create a new job
  static async create(jobData) {
    const {
      company_id,
      title,
      about_role,
      responsibilities,
      requirements,
      required_skills,
      benefits,
      compensation,
      application_deadline,
      Position_Type,
      Class_Level,
      Workplace_Type,
    } = jobData

    const [result] = await pool.query(
      `INSERT INTO Job 
       (company_id, title, about_role, responsibilities, requirements, 
        required_skills, benefits, compensation, application_deadline, 
        Position_Type, Class_Level, Workplace_Type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_id,
        title,
        about_role,
        responsibilities,
        requirements,
        required_skills,
        benefits,
        compensation,
        application_deadline,
        Position_Type,
        Class_Level,
        Workplace_Type,
      ],
    )

    return {
      job_id: result.insertId,
      ...jobData,
    }
  }

  // Get all jobs with company info and skills (for listing page)
  static async findAll(filters = {}, limit = 10, offset = 0) {
    const {
      Position_Type,
      Class_Level,
      Workplace_Type,
      search,
      company_id,
      min_compensation,
      max_compensation,
    } = filters

    let query = `
      SELECT 
        j.job_id,
        j.title,
        j.compensation,
        j.posted_date,
        j.application_deadline,
        j.Position_Type,
        j.Class_Level,
        j.Workplace_Type,
        j.about_role,
        a.state,
        c.company_id,
        c.name as company_name,
        c.industry,
        GROUP_CONCAT(DISTINCT s.name) as skills,
        DATEDIFF(NOW(), j.posted_date) as days_ago
      FROM Job j
      INNER JOIN Company c ON j.company_id = c.company_id
      INNER JOIN address a on j.address_id = a.address_id
      LEFT JOIN Job_Skills js ON j.job_id = js.job_id
      LEFT JOIN Skills s ON js.Skill_ID = s.Skill_ID
      WHERE 1=1
    `

    const params = []

    // Apply filters
    if (Position_Type) {
      query += ' AND j.Position_Type = ?'
      params.push(Position_Type)
    }

    if (Class_Level) {
      query += ' AND j.Class_Level = ?'
      params.push(Class_Level)
    }

    if (Workplace_Type) {
      query += ' AND j.Workplace_Type = ?'
      params.push(Workplace_Type)
    }

    if (search) {
      query += ' AND (j.title LIKE ? OR c.name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    if (company_id) {
      query += ' AND j.company_id = ?'
      params.push(company_id)
    }

    if (min_compensation) {
      query += ' AND j.compensation >= ?'
      params.push(min_compensation)
    }

    if (max_compensation) {
      query += ' AND j.compensation <= ?'
      params.push(max_compensation)
    }

    query += `
      GROUP BY j.job_id, j.title, j.compensation, j.posted_date, 
               j.application_deadline, j.Position_Type, j.Class_Level, 
               j.Workplace_Type, j.about_role, c.company_id, c.name, c.industry , a.state
      ORDER BY j.posted_date DESC
      LIMIT ? OFFSET ?
    `

    params.push(limit, offset)

    const [rows] = await pool.query(query, params)

    // Transform skills string to array
    return rows.map((row) => ({
      ...row,
      skills: row.skills ? row.skills.split(',') : [],
    }))
  }

  // Get total count for pagination
  static async getCount(filters = {}) {
    const {
      Position_Type,
      Class_Level,
      Workplace_Type,
      search,
      company_id,
      min_compensation,
      max_compensation,
    } = filters

    let query = `
      SELECT COUNT(DISTINCT j.job_id) as total
      FROM Job j
      INNER JOIN Company c ON j.company_id = c.company_id
      WHERE 1=1
    `

    const params = []

    if (Position_Type) {
      query += ' AND j.Position_Type = ?'
      params.push(Position_Type)
    }

    if (Class_Level) {
      query += ' AND j.Class_Level = ?'
      params.push(Class_Level)
    }

    if (Workplace_Type) {
      query += ' AND j.Workplace_Type = ?'
      params.push(Workplace_Type)
    }

    if (search) {
      query += ' AND (j.title LIKE ? OR c.name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    if (company_id) {
      query += ' AND j.company_id = ?'
      params.push(company_id)
    }

    if (min_compensation) {
      query += ' AND j.compensation >= ?'
      params.push(min_compensation)
    }

    if (max_compensation) {
      query += ' AND j.compensation <= ?'
      params.push(max_compensation)
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
        c.name as company_name,
        c.overview as company_overview,
        c.industry,
        c.company_size,
        a.state,
        GROUP_CONCAT(DISTINCT s.name) as skills,
        GROUP_CONCAT(DISTINCT s.Skill_ID) as skill_ids,
        DATEDIFF(NOW(), j.posted_date) as days_ago
      FROM Job j
      INNER JOIN Company c ON j.company_id = c.company_id
      INNER JOIN address a on j.address_id = a.address_id
      LEFT JOIN Job_Skills js ON j.job_id = js.job_id
      LEFT JOIN Skills s ON js.Skill_ID = s.Skill_ID
      WHERE j.job_id = ?
      GROUP BY j.job_id
    `

    const [rows] = await pool.query(query, [job_id])

    if (rows.length === 0) {
      return null
    }

    const job = rows[0]
    return {
      ...job,
      skills: job.skills ? job.skills.split(',') : [],
      skill_ids: job.skill_ids ? job.skill_ids.split(',').map(Number) : [],
    }
  }

  // Update job
  static async update(job_id, updates) {
    const allowedFields = [
      'title',
      'about_role',
      'responsibilities',
      'requirements',
      'required_skills',
      'benefits',
      'compensation',
      'application_deadline',
      'Position_Type',
      'Class_Level',
      'Workplace_Type',
    ]

    const fields = []
    const values = []

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(updates[key])
      }
    })

    if (fields.length === 0) {
      throw new Error('No valid fields to update')
    }

    values.push(job_id)

    const [result] = await pool.query(
      `UPDATE Job SET ${fields.join(', ')} WHERE job_id = ?`,
      values,
    )

    return result.affectedRows > 0
  }

  // Delete job
  static async delete(job_id) {
    const [result] = await pool.query('DELETE FROM Job WHERE job_id = ?', [
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
        GROUP_CONCAT(DISTINCT s.name) as skills
      FROM Job j
      INNER JOIN Company c ON j.company_id = c.company_id
      LEFT JOIN Job_Skills js ON j.job_id = js.job_id
      LEFT JOIN Skills s ON js.Skill_ID = s.Skill_ID
      WHERE j.company_id = ?
      GROUP BY j.job_id
      ORDER BY j.posted_date DESC
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
        j.compensation,
        j.Position_Type,
        j.Workplace_Type,
        c.name as company_name,
        c.industry,
        GROUP_CONCAT(DISTINCT s.name) as skills
      FROM Job j
      INNER JOIN Company c ON j.company_id = c.company_id
      LEFT JOIN Job_Skills js ON j.job_id = js.job_id
      LEFT JOIN Skills s ON js.Skill_ID = s.Skill_ID
      WHERE j.title LIKE ? OR c.name LIKE ? OR s.name LIKE ?
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
  static async addSkill(job_id, skill_id) {
    try {
      await pool.query(
        'INSERT INTO Job_Skills (job_id, Skill_ID) VALUES (?, ?)',
        [job_id, skill_id],
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
  static async removeSkill(job_id, skill_id) {
    const [result] = await pool.query(
      'DELETE FROM Job_Skills WHERE job_id = ? AND Skill_ID = ?',
      [job_id, skill_id],
    )
    return result.affectedRows > 0
  }

  // Get active jobs (not past deadline)
  static async getActiveJobs(limit = 10, offset = 0) {
    const query = `
      SELECT 
        j.*,
        c.name as company_name,
        GROUP_CONCAT(DISTINCT s.name) as skills
      FROM Job j
      INNER JOIN Company c ON j.company_id = c.company_id
      LEFT JOIN Job_Skills js ON j.job_id = js.job_id
      LEFT JOIN Skills s ON js.Skill_ID = s.Skill_ID
      WHERE j.application_deadline >= CURDATE() OR j.application_deadline IS NULL
      GROUP BY j.job_id
      ORDER BY j.posted_date DESC
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
