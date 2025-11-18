import mysql from 'mysql2/promise'

let pool = null

export default async function initMySQL() {
  try {
    let dbStatus

    // Create pool only once
    if (!pool) {
      pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      })

      // Test connection
      await pool.getConnection()
      dbStatus = '*    DB Connection: OK\n****************************\n'
    } else {
      dbStatus =
        '*    DB Connection: Already Running \n****************************\n'
    }

    // Prints initialization
    console.log('****************************')
    console.log('*    Starting Server')
    console.log(`*    Port: ${process.env.PORT || 3000}`)
    console.log(`*    NODE_ENV: ${process.env.NODE_ENV}`)
    console.log('*    Database: MySQL')
    console.log(dbStatus)

    return pool
  } catch (error) {
    console.log('***DB ERROR***')
    console.log({ error })
  }
}

export function getDB() {
  if (!pool) {
    throw new Error('Database not initialized. Call initDB() first.')
  }
  return pool
}
