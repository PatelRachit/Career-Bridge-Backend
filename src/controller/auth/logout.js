import { STATUS_CODE } from '../../constant/index.js'
import { handleError } from '../../utils/index.js'

/**
 * Logout function called by route
 */
const logout = async (req, res) => {
  try {
    res.clearCookie('authToken', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    })
    res
      .status(STATUS_CODE.SUCCESS)
      .json({ success: true, msg: 'Log out successfully' })
  } catch (error) {
    handleError(res, error)
  }
}

export { logout }
