import express from 'express'
import { tryCatch } from '../utils/helpers/tryCatch.js'
const router = express.Router()

router.get(
  '/',
  tryCatch(async (_req, res, _next) => {
    res.status(200).json({ apis: 'success' })
    // throw new ValidationError('Fail to validate login')
  }),
)

export default router
