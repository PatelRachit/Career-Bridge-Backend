import express from 'express'
import trimRequest from 'trim-request'
import { createUser } from '../controller/user/createUser.js'

import passport from 'passport'
import { getUser } from '../controller/user/getUser.js'
import { updateProfile } from '../controller/user/updateUser.js'
import { applyJob } from '../controller/user/applyJob.js'
import { getApplications } from '../controller/user/getApplications.js'
import { withdrawApplication } from '../controller/user/withdrawApplication.js'
import { saveJob } from '../controller/user/saveJob.js'
import { getSavedJobs } from '../controller/user/getSavedJobs.js'
import { getOverview } from '../controller/user/getOverview.js'
import { updateSavedJobs } from '../controller/user/updateSavedJobs.js'

const router = express.Router()

const requireAuth = passport.authenticate('jwt', {
  session: false,
})

router.post('/', trimRequest.all, createUser)

router.get('/', requireAuth, trimRequest.all, getUser)

router.put('/', requireAuth, trimRequest.all, updateProfile)

router.post('/apply/:id', requireAuth, trimRequest.all, applyJob)

router.get('/applications', requireAuth, trimRequest.all, getApplications)

router.get('/save', requireAuth, trimRequest.all, getSavedJobs)

router.get('/overview', requireAuth, trimRequest.all, getOverview)

router.post('/save/:id', requireAuth, trimRequest.all, saveJob)

router.put('/save/:id', requireAuth, trimRequest.all, updateSavedJobs)

router.delete(
  '/applications/:id',
  requireAuth,
  trimRequest.all,
  withdrawApplication,
)

export default router
