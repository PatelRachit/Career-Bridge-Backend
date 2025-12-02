import passport from 'passport'
import { Strategy as JwtStrategy } from 'passport-jwt'
import Applicant from '../model/Applicant.js'

const cookieExtractor = (req) => {
  let token = null
  if (req && req.cookies.authToken) {
    token = req.cookies.authToken
  }
  return token
}

/**
 * Options object for jwt middleware
 */
const jwtOptions = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET || '',
}

/**
 * Login with JWT middleware
 */
const jwtLogin = new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await Applicant.findByEmail(payload.data.email)
    if (!user) {
      return done(null, false)
    }

    return done(null, user)
  } catch (err) {
    return done(err, false)
  }
})

passport.use(jwtLogin)
