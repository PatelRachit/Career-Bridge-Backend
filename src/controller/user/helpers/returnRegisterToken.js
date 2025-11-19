import { generateToken } from './generateToken.js'

/**
 * Builds the registration token
 */
export const returnRegisterToken = async (user, userInfo) => {
  const token = await generateToken(user.email)
  const data = {
    token,
    user: userInfo,
  }
  return data
}

export default { returnRegisterToken }
