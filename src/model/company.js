import pool from '../config/mysql.js'
import { ERROR_CODE } from '../constant/errorCode.js'
import { buildErrObject } from '../utils/buildErrObject.js'
import bcrypt from 'bcrypt'

class Recruiter {
  // Create a new recruiter with user, company, and address
  static async createCompany(recruiterData) {
    const {
      // User data
      first_name,
      last_name,
      phone_number,
      email,
      password,
      // Company data
      company_name,
      overview,
      industry,
      company_size,
      // Address data
      street,
      city,
      county,
      state,
      country,
    } = recruiterData

    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Check if user already exists
      const [existingUser] = await connection.query(
        `SELECT User_ID FROM User 
         WHERE email = ?
         LIMIT 1`,
        [email],
      )

      if (existingUser.length > 0) {
        throw buildErrObject(400, ERROR_CODE.EMAIL_ALREADY_EXISTS)
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create User with isAdmin = true
      const [userResult] = await connection.query(
        `INSERT INTO User (first_Name, last_Name, date_of_Birth, phone_Number, email, password, isAdmin)
         VALUES (?, ?, null, ?, ?, ?, true)`,
        [first_name, last_name, phone_number, email, hashedPassword],
      )

      const userId = userResult.insertId

      // Check if company already exists
      let companyId
      const [existingCompany] = await connection.query(
        `SELECT company_id FROM Company 
         WHERE name = ? 
         LIMIT 1`,
        [company_name],
      )

      if (existingCompany.length > 0) {
        // Use existing company
        companyId = existingCompany[0].company_id
      } else {
        // Create new company
        const [companyResult] = await connection.query(
          `INSERT INTO Company (name, overview, industry, company_size)
           VALUES (?, ?, ?, ?)`,
          [company_name, overview, industry, company_size],
        )

        companyId = companyResult.insertId

        // Create address
        const [addressResult] = await connection.query(
          `INSERT INTO Address (street, city, county, state, country)
           VALUES (?, ?, ?, ?, ?)`,
          [street, city, county, state, country],
        )

        const addressId = addressResult.insertId

        // Link company and address
        await connection.query(
          `INSERT INTO Company_Address (company_id, address_id)
           VALUES (?, ?)`,
          [companyId, addressId],
        )
      }

      // Create Recruiter link
      await connection.query(
        `INSERT INTO Recruiter (user_id, company_id)
         VALUES (?, ?)`,
        [userId, companyId],
      )

      await connection.commit()

      return {
        userId,
        companyId,
        firstName: first_name,
        lastName: last_name,
        email,
        phoneNumber: phone_number,
        companyName: company_name,
        isAdmin: true,
      }
    } catch (error) {
      await connection.rollback()
      if (error.code && error.message) {
        throw error
      }
      throw buildErrObject(500, error.message)
    } finally {
      connection.release()
    }
  }

  // Get recruiter by user ID with company and address details
  static async getRecruiterByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT 
        u.User_ID,
        u.First_Name,
        u.Last_Name,
        u.Date_of_Birth,
        u.Phone_Number,
        u.Email,
        u.Sex,
        u.isAdmin,
        c.company_id,
        c.name as company_name,
        c.overview,
        c.industry,
        c.company_size,
        a.address_id,
        a.street,
        a.city,
        a.county,
        a.state,
        a.country
      FROM Recruiter r
      INNER JOIN User u ON r.user_id = u.User_ID
      INNER JOIN Company c ON r.company_id = c.company_id
      LEFT JOIN Company_Address ca ON c.company_id = ca.company_id
      LEFT JOIN Address a ON ca.address_id = a.address_id
      WHERE r.user_id = ?
      LIMIT 1`,
      [userId],
    )
    return rows[0] || null
  }

  // Get recruiter by email
  static async getRecruiterByEmail(email) {
    const [rows] = await pool.query(
      `SELECT 
        u.User_ID,
        u.First_Name,
        u.Last_Name,
        u.Date_of_Birth,
        u.Phone_Number,
        u.Email,
        u.Password,
        u.Sex,
        u.isAdmin,
        c.company_id,
        c.name as company_name,
        c.overview,
        c.industry,
        c.company_size,
        a.address_id,
        a.street,
        a.city,
        a.county,
        a.state,
        a.country
      FROM Recruiter r
      INNER JOIN User u ON r.user_id = u.User_ID
      INNER JOIN Company c ON r.company_id = c.company_id
      LEFT JOIN Company_Address ca ON c.company_id = ca.company_id
      LEFT JOIN Address a ON ca.address_id = a.address_id
      WHERE u.Email = ?
      LIMIT 1`,
      [email],
    )
    return rows[0] || null
  }

  // Get all recruiters for a company
  static async getRecruitersByCompany(companyId) {
    const [rows] = await pool.query(
      `SELECT 
        u.User_ID,
        u.First_Name,
        u.Last_Name,
        u.Phone_Number,
        u.Email,
        u.isAdmin,
        c.company_id,
        c.name as company_name
      FROM Recruiter r
      INNER JOIN User u ON r.user_id = u.User_ID
      INNER JOIN Company c ON r.company_id = c.company_id
      WHERE r.company_id = ?
      ORDER BY u.Last_Name, u.First_Name`,
      [companyId],
    )
    return rows
  }

  // Get all recruiters
  static async getAllRecruiters() {
    const [rows] = await pool.query(
      `SELECT 
        u.User_ID,
        u.First_Name,
        u.Last_Name,
        u.Phone_Number,
        u.Email,
        u.Date_of_Birth,
        u.isAdmin,
        c.company_id,
        c.name as company_name,
        c.industry
      FROM Recruiter r
      INNER JOIN User u ON r.user_id = u.User_ID
      INNER JOIN Company c ON r.company_id = c.company_id
      ORDER BY u.Last_Name, u.First_Name`,
    )
    return rows
  }

  // Update recruiter user information
  static async updateRecruiterUser(userId, userData) {
    const {
      first_name,
      last_name,
      date_of_birth,
      phone_number,
      email,
      sex,
      password,
    } = userData

    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Check if new email or phone already exists (excluding current user)
      if (email || phone_number) {
        const [existing] = await connection.query(
          `SELECT User_ID FROM User 
           WHERE (Email = ? OR Phone_Number = ?) AND User_ID != ? 
           LIMIT 1`,
          [email || '', phone_number || '', userId],
        )

        if (existing.length > 0) {
          throw buildErrObject(
            400,
            'User with this email or phone number already exists',
          )
        }
      }

      let hashedPassword = null
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10)
      }

      const [result] = await connection.query(
        `UPDATE User 
         SET First_Name = COALESCE(?, First_Name),
             Last_Name = COALESCE(?, Last_Name),
             Date_of_Birth = COALESCE(?, Date_of_Birth),
             Phone_Number = COALESCE(?, Phone_Number),
             Email = COALESCE(?, Email),
             Password = COALESCE(?, Password),
             Sex = COALESCE(?, Sex)
         WHERE User_ID = ?`,
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

      if (result.affectedRows === 0) {
        throw buildErrObject(404, 'User not found')
      }

      await connection.commit()
      return await this.getRecruiterByUserId(userId)
    } catch (error) {
      await connection.rollback()
      if (error.code && error.message) {
        throw error
      }
      throw buildErrObject(500, error.message)
    } finally {
      connection.release()
    }
  }

  // Update recruiter's company
  static async updateRecruiterCompany(userId, companyId) {
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Check if company exists
      const [companyExists] = await connection.query(
        `SELECT company_id FROM Company 
         WHERE company_id = ? 
         LIMIT 1`,
        [companyId],
      )

      if (companyExists.length === 0) {
        throw buildErrObject(404, 'Company not found')
      }

      // Update recruiter's company
      const [result] = await connection.query(
        `UPDATE Recruiter 
         SET company_id = ?
         WHERE user_id = ?`,
        [companyId, userId],
      )

      if (result.affectedRows === 0) {
        throw buildErrObject(404, 'Recruiter not found')
      }

      await connection.commit()
      return await this.getRecruiterByUserId(userId)
    } catch (error) {
      await connection.rollback()
      if (error.code && error.message) {
        throw error
      }
      throw buildErrObject(500, error.message)
    } finally {
      connection.release()
    }
  }

  // Delete recruiter (cascades to User due to ON DELETE CASCADE)
  static async deleteRecruiter(userId) {
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Delete from Recruiter table first
      const [recruiterResult] = await connection.query(
        `DELETE FROM Recruiter 
         WHERE user_id = ?`,
        [userId],
      )

      if (recruiterResult.affectedRows === 0) {
        throw buildErrObject(404, 'Recruiter not found')
      }

      // Delete from User table (this will cascade)
      const [userResult] = await connection.query(
        `DELETE FROM User 
         WHERE User_ID = ?`,
        [userId],
      )

      await connection.commit()
      return true
    } catch (error) {
      await connection.rollback()
      if (error.code && error.message) {
        throw error
      }
      throw buildErrObject(500, error.message)
    } finally {
      connection.release()
    }
  }

  // Check if user is a recruiter
  static async isRecruiter(userId) {
    const [rows] = await pool.query(
      `SELECT user_id FROM Recruiter 
       WHERE user_id = ? 
       LIMIT 1`,
      [userId],
    )
    return rows.length > 0
  }

  // Get recruiter count
  static async getRecruiterCount() {
    const [rows] = await pool.query(`SELECT COUNT(*) as count FROM Recruiter`)
    return rows[0].count
  }

  // Search recruiters
  static async searchRecruiters(searchTerm) {
    const [rows] = await pool.query(
      `SELECT 
        u.User_ID,
        u.First_Name,
        u.Last_Name,
        u.Phone_Number,
        u.Email,
        u.isAdmin,
        c.company_id,
        c.name as company_name,
        c.industry
      FROM Recruiter r
      INNER JOIN User u ON r.user_id = u.User_ID
      INNER JOIN Company c ON r.company_id = c.company_id
      WHERE u.First_Name LIKE ? 
         OR u.Last_Name LIKE ? 
         OR u.Email LIKE ?
         OR c.name LIKE ?
      ORDER BY u.Last_Name, u.First_Name`,
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

    if (!recruiter) {
      return null
    }

    const isValid = await bcrypt.compare(password, recruiter.Password)

    if (!isValid) {
      return null
    }

    // Remove password from returned object
    delete recruiter.Password
    return recruiter
  }
}

export default Recruiter
