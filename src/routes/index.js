import express from 'express'

import testRoutes from './test.js'
import userRouter from './user.js'
import authRouter from './auth.js'
import jobRouter from './job.js'

const router = express.Router()

router.use('/test', testRoutes)
router.use('/', authRouter)
router.use('/user', userRouter)
router.use('/job', jobRouter)

export default router
