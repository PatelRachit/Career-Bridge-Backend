import bcrypt from 'bcrypt'
import pool from '../config/mysql.js'
import { buildErrObject } from '../utils/buildErrObject.js'
import { ERROR_CODE } from '../constant/errorCode.js'

const { EMAIL_ALREADY_EXISTS } = ERROR_CODE

const SALT_ROUNDS = 10

class Applicant {
  // Create a new applicant
  static async create(applicantData) {
    const {
      first_name,
      last_name,
      date_of_birth,
      phone_number,
      email,
      password,
    } = applicantData

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const [result] = await pool.query(
      `INSERT INTO User 
       (first_name, last_name, date_of_birth, phone_number, email, password)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        last_name,
        new Date(date_of_birth),
        phone_number,
        email,
        hashedPassword,
      ],
    )

    return {
      applicantId: result.insertId,
      first_name,
      last_name,
      date_of_birth,
      phone_number,
      email,
    }
  }

  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM User WHERE email = ? LIMIT 1',
      [email],
    )

    if (rows.length === 0) {
      return null
    }

    const applicant = rows[0]

    // Get all skills for this applicant
    const [skillRows] = await pool.query(
      `SELECT s.Skill_ID, s.name 
    FROM Skills s
    INNER JOIN Applicant_Skills aps ON s.Skill_ID = aps.Skill_ID
    WHERE aps.applicant_id = ?`,
      [applicant.applicant_id],
    )

    // Return applicant with skills
    return {
      ...applicant,
      skills: skillRows?.map((skill) => skill.name) || [],
    }
  }
  static async findById(applicantId) {
    const [applicantRows] = await pool.query(
      `SELECT * FROM User WHERE User_ID = ? LIMIT 1`,
      [applicantId],
    )

    if (applicantRows.length === 0) {
      return null
    }

    const applicant = applicantRows[0]

    // Get all experience records
    const [experienceRows] = await pool.query(
      `SELECT * FROM Experience WHERE applicant_id = ? ORDER BY start_date DESC`,
      [applicantId],
    )

    // Get all education records
    const [educationRows] = await pool.query(
      `SELECT * FROM Education WHERE applicant_id = ? ORDER BY start_date DESC`,
      [applicantId],
    )

    // Get all skills
    const [skillRows] = await pool.query(
      `SELECT s.* FROM Skills s
     INNER JOIN Applicant_Skills as2 ON s.Skill_ID = as2.Skill_ID
     WHERE as2.applicant_id = ?`,
      [applicantId],
    )

    // Combine all data
    return {
      ...applicant,
      experience: experienceRows || [],
      education: educationRows || [],
      skills: skillRows.map((skill) => skill.name) || [],
    }
  }

  static async emailExists(email) {
    try {
      const [rows] = await pool.query(
        'SELECT User_id FROM User WHERE email = ? LIMIT 1',
        [email],
      )

      if (rows.length > 0) {
        throw buildErrObject(422, EMAIL_ALREADY_EXISTS)
      }
      return false
    } catch (error) {
      if (error.code && error.message) {
        throw error
      }
      throw buildErrObject(422, error.message)
    }
  }

  // Update basic applicant info
  static async updateBasicInfo(connection, applicantId, updates) {
    if (Object.keys(updates).length === 0) {
      return true
    }

    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ')
    const values = Object.values(updates)

    const [result] = await connection.query(
      `UPDATE Applicant SET ${fields} WHERE applicant_id = ?`,
      [...values, applicantId],
    )

    return result.affectedRows > 0
  }

  // Skills Management
  static async deleteAllSkills(connection, applicantId) {
    await connection.query(
      `DELETE FROM Applicant_Skills WHERE applicant_id = ?`,
      [applicantId],
    )
  }

  static async findOrCreateSkill(connection, skillName) {
    let [skillRows] = await connection.query(
      `SELECT Skill_ID FROM Skills WHERE name = ?`,
      [skillName],
    )

    if (skillRows.length === 0) {
      const [result] = await connection.query(
        `INSERT INTO Skills (name) VALUES (?)`,
        [skillName],
      )
      return result.insertId
    }

    return skillRows[0].Skill_ID
  }

  static async addSkillToApplicant(connection, applicantId, skillId) {
    await connection.query(
      `INSERT INTO Applicant_Skills (applicant_id, Skill_ID) VALUES (?, ?)`,
      [applicantId, skillId],
    )
  }

  // Experience - Insert or Update
  static async deleteAllExperience(connection, applicantId) {
    await connection.query(`DELETE FROM Experience WHERE applicant_id = ?`, [
      applicantId,
    ])
  }

  static async createExperience(connection, applicantId, experienceData) {
    const {
      company,
      designation,
      current,
      role_description,
      start_date,
      end_date,
    } = experienceData

    await connection.query(
      `INSERT INTO Experience 
    (applicant_id, company, designation, current, role_description, start_date, end_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        applicantId,
        company,
        designation,
        current || false,
        role_description || null,
        start_date || null,
        current ? null : end_date || null,
      ],
    )
  }

  // Education Management - Replace All
  static async deleteAllEducation(connection, applicantId) {
    await connection.query(`DELETE FROM Education WHERE applicant_id = ?`, [
      applicantId,
    ])
  }

  static async createEducation(connection, applicantId, educationData) {
    const {
      school,
      degree,
      gpa,
      field_of_study,
      start_date,
      end_date,
      list_item,
    } = educationData

    await connection.query(
      `INSERT INTO Education 
    (applicant_id, school, degree, gpa, field_of_study, start_date, end_date, list_item) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applicantId,
        school,
        degree,
        gpa || null,
        field_of_study || null,
        start_date || null,
        end_date || null,
        list_item || null,
      ],
    )
  }
  // Delete applicant
  static async delete(applicantId) {
    const [result] = await pool.query(
      'DELETE FROM Applicant WHERE applicant_id = ?',
      [applicantId],
    )
    return result.affectedRows > 0
  }

  // Compare password (for login)
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword)
  }

  // Get all applicants (with pagination)
  static async findAll(limit = 10, offset = 0) {
    const [rows] = await pool.query(
      `SELECT applicant_id, first_name, last_name, date_of_birth, 
              phone_number, email, sex, resume_link, created_at 
       FROM Applicant 
       LIMIT ? OFFSET ?`,
      [limit, offset],
    )
    return rows
  }

  // Search applicants by name
  static async searchByName(searchTerm, limit = 10) {
    const [rows] = await pool.query(
      `SELECT applicant_id, first_name, last_name, email, phone_number, resume_link
       FROM Applicant 
       WHERE first_name LIKE ? OR last_name LIKE ?
       LIMIT ?`,
      [`%${searchTerm}%`, `%${searchTerm}%`, limit],
    )
    return rows
  }

  // Get applicant profile (without password)
  static async getProfile(applicantId) {
    const [rows] = await pool.query(
      `SELECT applicant_id, first_name, last_name, date_of_birth, 
              phone_number, email, sex, resume_link, created_at, updated_at
       FROM Applicant 
       WHERE applicant_id = ? 
       LIMIT 1`,
      [applicantId],
    )
    return rows[0] || null
  }
}

export default Applicant
