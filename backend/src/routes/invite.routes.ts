import { Router } from 'express'
import { authenticate, authorizeRole } from '../middleware/auth.middleware'
import {
  createChildWithAccounts,
  getInvitations,
  resetPassword
} from '../controllers/invite.controller'

const router = Router()

router.post('/', authenticate, authorizeRole('doctor', 'admin', 'super_admin'), createChildWithAccounts as any)
router.get('/', authenticate, authorizeRole('doctor', 'admin', 'super_admin'), getInvitations as any)
router.post('/reset-password', authenticate, authorizeRole('doctor', 'admin', 'super_admin'), resetPassword as any)

export default router
