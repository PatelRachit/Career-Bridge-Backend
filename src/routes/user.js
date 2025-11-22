import express from 'express'
import trimRequest from 'trim-request'
import { createUser } from '../controller/user/createUser.js'

import passport from 'passport'
import { getUser } from '../controller/user/getUser.js'
import { updateProfile } from '../controller/user/updateUser.js'

const router = express.Router()

const requireAuth = passport.authenticate('jwt', {
  session: false,
})

router.post('/', trimRequest.all, createUser)

router.get('/', requireAuth, trimRequest.all, getUser)

router.put('/', requireAuth, trimRequest.all, updateProfile)

export default router
