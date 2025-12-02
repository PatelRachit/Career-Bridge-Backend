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
      resume_link,
    } = applicantData

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const [resultSets] = await pool.query(
      `CALL CreateApplicant(?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        last_name,
        new Date(date_of_birth),
        phone_number,
        email,
        hashedPassword,
        resume_link || null,
      ],
    )

    // First result set returned from SELECT in procedure
    const user = resultSets[0]

    return user
  }

  static async findByEmail(email) {
    const [resultSets] = await pool.query(`CALL FindApplicantByEmail(?)`, [
      email,
    ])

    const userRows = resultSets[0]
    const skillRows = resultSets[1]

    if (!userRows || userRows.length === 0) return null

    return {
      ...userRows[0],
      skills: skillRows ? skillRows.map((row) => row.skill_name) : [],
    }
  }

  // Find applicant by ID
  static async findById(user_id) {
    const [resultSets] = await pool.query(`CALL GetApplicantById(?)`, [user_id])

    const userRow = resultSets[0][0]

    if (!userRow) return null

    const experienceRows = resultSets[1]
    const educationRows = resultSets[2]
    const skillRows = resultSets[3]

    return {
      ...userRow,
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

  // Compare password
  static async comparePassword(plain, hashed) {
    return bcrypt.compare(plain, hashed)
  }
}

export default Applicant
