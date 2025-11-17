import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import http from 'http'
import morgan from 'morgan'
import passport from 'passport'
import xss from 'xss-clean'
import logger from './src/config/logger/index.js'
import { ENVS, NODE_ENV } from './src/constant/index.js'
import router from './src/routes/index.js'
import { serverConnectionLog } from './src/utils/serverStartLog.js'

const app = express()

/**
 * -------------------------- CORS --------------------------
 */
app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  }),
)

/**
 * -------------------------- RATE LIMIT --------------------------
 *
 * Middleware for rate limiting requests if provided in the environment
 */
if (ENVS.RATE_LIMIT) {
  app.use(
    rateLimit({
      windowMs: (Number(ENVS.RATE_LIMIT_DURATION) || 1) * 60 * 60 * 1000, // Duration in milliseconds
      max: Number(ENVS.RATE_LIMIT_REQUEST || 200), // Total number of requests allowed in the duration
      message: `You have exceeded ${
        ENVS.RATE_LIMIT_REQUEST || 200
      } requests in ${
        ENVS.RATE_LIMIT_DURATION || 1
      } hour limit!, please try again in an hour!`, // Error message for exceeding limit
    }),
  )
}

/**
 * -------------------------- EXPRESS --------------------------
 */
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

/**
 * -------------------------- PASSPORT INITIALIZE --------------------------
 */
app.use(passport.initialize())

/**
 * -------------------------- MORGAN : LOGGER --------------------------
 *
 * Enable HTTP request logging middleware only in development environment
 */
if (process.env.NODE_ENV === NODE_ENV.dev) {
  app.use(morgan('dev'))
}

/**
 * -------------------------- COOKIE PARSER --------------------------
 */
app.use(cookieParser())

/**
 * -------------------------- COMPRESSION --------------------------
 *
 * Middleware for compressing response bodies
 */
app.use(compression())

/**
 * -------------------------- XSS --------------------------
 *
 * Middleware for sanitizing user input from XSS attacks
 */
app.use(xss())

/**
 * -------------------------- HELMET --------------------------
 *
 * Middleware for securing HTTP headers
 */
app.use(helmet())

/**
 * -------------------------- ROUTES --------------------------
 */
app.use(router)

const server = http.createServer(app)

const AppServer = async () => {
  try {
    // connect sql

    server.listen(process.env.PORT || 3000, () => serverConnectionLog())
  } catch (err) {
    console.log(err)
  }
}

AppServer()

process.on('unhandledRejection', (reason) => {
  throw reason
})

process.on('uncaughtException', (err) => {
  logger.error(err)
  process.exit(0)
})

export default app
