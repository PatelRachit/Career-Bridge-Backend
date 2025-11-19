import express from 'express'
import trimRequest from 'trim-request'
import { getAllJobs } from '../controller/job/getAllJobs.js'
import { getJob } from '../controller/job/getJob.js'
import { searchJobs } from '../controller/job/searchJobs.js'

const router = express.Router()

router.get('/', trimRequest.all, getAllJobs)
router.get('/:id', trimRequest.all, getJob)
router.get('/search', trimRequest.all, searchJobs)

export default router
