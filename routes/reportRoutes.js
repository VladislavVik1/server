import express from 'express'
import { createReport, updateStatus } from '../controllers/reportController.js'
import { authenticate } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = express.Router()

router.post('/reports', authenticate(['public']), upload.single('image'), createReport)
router.put('/reports/:id/status', authenticate(['responder']), updateStatus)

export default router
