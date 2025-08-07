import express from 'express'
import { getMapData } from '../controllers/reportController.js'
const router = express.Router()

router.get('/map-data', getMapData)

export default router
