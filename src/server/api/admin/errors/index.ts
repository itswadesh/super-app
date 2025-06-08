import { Hono } from 'hono'
import { errorControllers } from '../controllers'

// Create router for error management
const router = new Hono()

// GET error statistics by category
router.get('/stats', errorControllers.getErrorStats)

// GET all error logs
router.get('/', errorControllers.getErrors)

// DELETE all error logs
router.delete('/', errorControllers.clearErrors)

// GET a specific error log
router.get('/:id', errorControllers.getError)

// UPDATE a specific error log
router.patch('/:id', errorControllers.updateError)

// DELETE a specific error log
router.delete('/:id', errorControllers.deleteError)

export default router
