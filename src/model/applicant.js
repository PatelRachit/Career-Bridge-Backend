import bcrypt from 'bcrypt'
import pool from '../config/mysql.js'
import { buildErrObject } from '../utils/buildErrObject.js'
import { ERROR_CODE } from '../constant/errorCode.js'

const { EMAIL_ALREADY_EXISTS } = ERROR_CODE
const SALT_ROUNDS = 10

class Applicant {
  // Create a new applicant (inserts into user + applicant)
  static async create(applicantData) {
    const {
      first_name,
      last_name,
      date_of_birth,
      phone_number,
      email,
      password,
    } = applicantData

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const [userResult] = await pool.query(
      `INSERT INTO user 
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

    const user_id = userResult.insertId

    await pool.query(
      `INSERT INTO applicant (user_id, resume_link) VALUES (?, ?)`,
      [user_id, applicantData.resume_link || null],
    )

    return {
      user_id,
      first_name,
      last_name,
      date_of_birth,
      phone_number,
      email,
    }
  }

  // Find applicant by email
  static async findByEmail(email) {
    const [rows] = await pool.query(
      `SELECT * FROM user WHERE email = ? LIMIT 1`,
      [email],
    )

    if (rows.length === 0) return null

    const user = rows[0]

    const [skillRows] = await pool.query(
      `SELECT skill_name FROM applicant_skills WHERE user_id = ?`,
      [user.user_id],
    )

    return {
      ...user,
      skills: skillRows.map((s) => s.skill_name),
    }
  }

  // Find applicant by ID
  static async findById(user_id) {
    const [applicantRows] = await pool.query(
      `SELECT * FROM user u JOIN applicant a ON a.user_id = u.user_id WHERE u.user_id = ? LIMIT 1`,
      [user_id],
    )

    if (applicantRows.length === 0) return null

    const user = applicantRows[0]

    const [experienceRows] = await pool.query(
      `SELECT * FROM experience WHERE user_id = ? ORDER BY start_date DESC`,
      [user_id],
    )

    const [educationRows] = await pool.query(
      `SELECT * FROM education WHERE user_id = ? ORDER BY start_date DESC`,
      [user_id],
    )

    const [skillRows] = await pool.query(
      `SELECT skill_name FROM applicant_skills WHERE user_id = ?`,
      [user_id],
    )

    return {
      ...user,
      experience: experienceRows,
      education: educationRows,
      skills: skillRows.map((s) => s.skill_name),
    }
  }

  // Check if email exists
  static async emailExists(email) {
    const [rows] = await pool.query(
      `SELECT user_id FROM user WHERE email = ? LIMIT 1`,
      [email],
    )

    if (rows.length > 0) {
      throw buildErrObject(422, EMAIL_ALREADY_EXISTS)
    }
    return false
  }

  // Update basic applicant info (in applicant table)
  static async updateBasicInfo(connection, user_id, updates) {
    if (Object.keys(updates).length === 0) return true

    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ')
    const values = Object.values(updates)

    const [result] = await connection.query(
      `UPDATE user SET ${fields} WHERE user_id = ?`,
      [...values, user_id],
    )

    return result.affectedRows > 0
  }

  static async updateResumeLink(connection, link, user) {
    const [result] = await connection.query(
      `UPDATE applicant SET resume_link = ? WHERE user_id = ?`,
      [link, user],
    )
    return result
  }

  // SKILLS MANAGEMENT

  static async deleteAllSkills(connection, user_id) {
    await connection.query(`DELETE FROM applicant_skills WHERE user_id = ?`, [
      user_id,
    ])
  }

  static async findOrCreateSkill(connection, skillName) {
    let [rows] = await connection.query(
      `SELECT name FROM skills WHERE name = ?`,
      [skillName],
    )

    if (rows.length === 0) {
      await connection.query(`INSERT INTO skills (name) VALUES (?)`, [
        skillName,
      ])
      return skillName
    }

    return rows[0].name
  }

  static async addSkillToApplicant(connection, user_id, skillName) {
    await connection.query(
      `INSERT INTO applicant_skills (user_id, skill_name) VALUES (?, ?)`,
      [user_id, skillName],
    )
  }

  // EXPERIENCE MANAGEMENT

  static async deleteAllExperience(connection, user_id) {
    await connection.query(`DELETE FROM experience WHERE user_id = ?`, [
      user_id,
    ])
  }

  static async createExperience(connection, user_id, exp) {
    const {
      company,
      designation,
      role_description,
      start_date,
      end_date,
      current,
    } = exp

    await connection.query(
      `INSERT INTO experience 
      (user_id, company, designation, role_description, start_date, end_date, current)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        company,
        designation,
        role_description,
        start_date,
        current ? null : end_date,
        current || false,
      ],
    )
  }

  // EDUCATION MANAGEMENT

  static async deleteAllEducation(connection, user_id) {
    await connection.query(`DELETE FROM education WHERE user_id = ?`, [user_id])
  }

  static async createEducation(connection, user_id, edu) {
    const { school, degree, gpa, field_of_study, start_date, end_date } = edu

    await connection.query(
      `INSERT INTO education 
      (user_id, school, degree, gpa, field_of_study, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        school,
        degree,
        gpa || null,
        field_of_study || null,
        start_date || null,
        end_date || null,
      ],
    )
  }

  // Delete applicant
  static async delete(user_id) {
    const [result] = await pool.query(
      `DELETE FROM applicant WHERE user_id = ?`,
      [user_id],
    )
    return result.affectedRows > 0
  }

  // Compare password
  static async comparePassword(plain, hashed) {
    return bcrypt.compare(plain, hashed)
  }

  // Find all applicants
  static async findAll(limit = 10, offset = 0) {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.date_of_birth, 
              u.phone_number, u.email, a.resume_link
       FROM user u
       INNER JOIN applicant a ON u.user_id = a.user_id
       LIMIT ? OFFSET ?`,
      [limit, offset],
    )

    return rows
  }

  // Search applicants
  static async searchByName(searchTerm, limit = 10) {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone_number, a.resume_link
       FROM user u
       INNER JOIN applicant a ON u.user_id = a.user_id
       WHERE u.first_name LIKE ? OR u.last_name LIKE ?
       LIMIT ?`,
      [`%${searchTerm}%`, `%${searchTerm}%`, limit],
    )

    return rows
  }

  // Get profile (joined view)
  static async getProfile(user_id) {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.date_of_birth,
              u.phone_number, u.email, a.resume_link
       FROM user u
       INNER JOIN applicant a ON u.user_id = a.user_id
       WHERE u.user_id = ?
       LIMIT 1`,
      [user_id],
    )

    return rows[0] || null
  }
}

export default Applicant
