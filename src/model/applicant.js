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
      `INSERT INTO Applicant 
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
      'SELECT * FROM Applicant WHERE email = ? LIMIT 1',
      [email],
    )
    return rows[0] || null
  }

  static async findById(applicantId) {
    const [rows] = await pool.query(
      'SELECT * FROM Applicant WHERE applicant_id = ? LIMIT 1',
      [applicantId],
    )
    return rows[0] || null
  }

  static async emailExists(email) {
    try {
      const [rows] = await pool.query(
        'SELECT applicant_id FROM Applicant WHERE email = ? LIMIT 1',
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

  static async update(applicantId, updates) {
    const allowedFields = [
      'first_name',
      'last_name',
      'date_of_birth',
      'phone_number',
      'email',
      'sex',
      'resume_link',
    ]

    const fields = []
    const values = []

    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      dateOfBirth: 'date_of_birth',
      phoneNumber: 'phone_number',
      resumeLink: 'resume_link',
    }

    // Handle password update separately (needs hashing)
    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, SALT_ROUNDS)
      fields.push('password = ?')
      values.push(hashedPassword)
    }

    Object.keys(updates).forEach((key) => {
      const dbField = fieldMap[key] || key
      if (allowedFields.includes(dbField) && key !== 'password') {
        fields.push(`${dbField} = ?`)
        values.push(updates[key])
      }
    })

    if (fields.length === 0) {
      throw new Error('No valid fields to update')
    }

    values.push(applicantId)

    const [result] = await pool.query(
      `UPDATE Applicant SET ${fields.join(', ')} WHERE applicant_id = ?`,
      values,
    )

    return result.affectedRows > 0
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
