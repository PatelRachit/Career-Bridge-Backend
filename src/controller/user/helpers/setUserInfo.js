export const setUserInfo = (req = {}) =>
  new Promise((resolve) => {
    let user = {
      applicant_id: req.applicant_id,
      firstName: req.firstName,
      email: req.email,
    }

    resolve(user)
  })
