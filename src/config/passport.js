import passport from 'passport'
import { Strategy as JwtStrategy } from 'passport-jwt'
import { decrypt } from '../middleware/auth/dcrypt.js'
import User from '../model/user.js'

const cookieExtractor = (req) => {
  let token = null
  if (req && req.cookies.authToken) {
    token = req.cookies.authToken
  }
  if (token) {
    // Decrypts token
    token = decrypt(token)
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
    const user = await User.findById(payload.data._id)

    if (!user) {
      return done(null, false)
    }

    return done(null, user.toJSON())
  } catch (err) {
    return done(err, false)
  }
})

passport.use(jwtLogin)
