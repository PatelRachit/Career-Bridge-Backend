import express from 'express'
import trimRequest from 'trim-request'
import { createCompany } from '../controller/company/createCompany.js'

const router = express.Router()

router.post('/', trimRequest.all, createCompany)

export default router
