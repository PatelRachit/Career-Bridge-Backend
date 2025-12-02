export const setUserInfo = (req = {}) =>
  new Promise((resolve) => {
    console.log('000', req)
    let user = {
      user_id: req.user_id,
      firstName: req.firstName,
      email: req.email,
    }

    resolve(user)
  })
