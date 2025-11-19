import jwt from 'jsonwebtoken'

/**
 * Generates a token
 * @param {string} user - user ID
 */
export const generateToken = async (user) => {
  const jwtExpiryMin = 3600

  // Gets expiration time
  const expiration = Math.floor(Date.now() / 1000) + 60 * jwtExpiryMin

  // returns signed and encrypted token
  const token = jwt.sign(
    {
      data: {
        email: user,
      },
      exp: expiration,
    },
    process.env.JWT_SECRET,
  )
  return token
}
