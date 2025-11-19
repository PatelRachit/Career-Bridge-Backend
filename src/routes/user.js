import express from 'express'
import trimRequest from 'trim-request'
import { createUser } from '../controller/user/createUser.js'

const router = express.Router()

router.post('/', trimRequest.all, createUser)

export default router
