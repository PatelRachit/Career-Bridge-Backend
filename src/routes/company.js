import express from 'express'
import trimRequest from 'trim-request'
import { createCompany } from '../controller/company/createCompany.js'
import passport from 'passport'
import { getJobsByCompany } from '../controller/company/getJobsByCompany.js'
import { getApplicantProfile } from '../controller/company/getApplicantProfile.js'
import { getApplicantsByJob } from '../controller/company/getApplicantByJob.js'
import { rejectApplication } from '../controller/company/rejectApplication.js'
import { getClassLevels } from '../controller/company/lookups/getClassLevels.js'
import { getPositionTypes } from '../controller/company/lookups/getPositionTypes.js'
import { getWorkplaceTypes } from '../controller/company/lookups/getWorkplaceTypes.js'
import { getSkills } from '../controller/company/lookups/getSkills.js'
import { createJob } from '../controller/company/createJob.js'
import { scheduleInterview } from '../controller/company/scheduleInterview.js'

const router = express.Router()

const requireAuth = passport.authenticate('jwt', {
  session: false,
})

router.post('/', trimRequest.all, createCompany)

router.get('/jobs', requireAuth, trimRequest.all, getJobsByCompany)

router.get('/applicants/:id', requireAuth, trimRequest.all, getApplicantsByJob)

router.get(
  '/applicants/profile/:id',
  requireAuth,
  trimRequest.all,
  getApplicantProfile,
)

router.post('/reject/', requireAuth, trimRequest.all, rejectApplication)

router.post('/schedule', requireAuth, trimRequest.all, scheduleInterview)

router.post('/job', requireAuth, trimRequest.all, createJob)

router.get('/lookup/skills', requireAuth, trimRequest.all, getSkills)

router.get(
  '/lookup/position-types',
  requireAuth,
  trimRequest.all,
  getPositionTypes,
)
router.get('/lookup/class-levels', requireAuth, trimRequest.all, getClassLevels)

router.get(
  '/lookup/workplace-types',
  requireAuth,
  trimRequest.all,
  getWorkplaceTypes,
)

export default router
