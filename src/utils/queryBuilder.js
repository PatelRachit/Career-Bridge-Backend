import pool from '../config/mysql'

export const queryBuilder = async (query, parameters) => {
  try {
    const [rows] = await pool.query(query, parameters)
    return rows
  } catch (err) {
    throw buildErrObject(422, err.message)
  }
}
