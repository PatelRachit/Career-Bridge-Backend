import { buildErrObject } from '../../utils/buildErrObject.js'

const checkPassword = (password, user) =>
  new Promise((resolve, reject) => {
    user.comparePassword(password, (err, isMatch) => {
      if (err) {
        return reject(buildErrObject(422, err.message))
      }
      if (!isMatch) {
        resolve(false)
      }
      resolve(true)
    })
  })

export { checkPassword }
