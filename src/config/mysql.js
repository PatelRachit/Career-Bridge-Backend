import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function initMySQL() {
  try {
    // Test connection
    const connection = await pool.getConnection()
    connection.release()

    // Prints initialization
    console.log('****************************')
    console.log('*    Starting Server')
    console.log(`*    Port: ${process.env.PORT || 3000}`)
    console.log(`*    NODE_ENV: ${process.env.NODE_ENV}`)
    console.log('*    Database: MySQL')
    console.log('*    DB Connection: OK')
    console.log('****************************\n')

    return pool
  } catch (error) {
    console.log('***DB ERROR***')
    console.log({ error })
    throw error
  }
}

export default pool
