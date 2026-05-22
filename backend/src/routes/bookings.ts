import { Router } from 'express';
import {
  getBookings, getBooking, createBooking, updateBooking,
  cancelBooking, approveBooking, rejectBooking,
  getCalendarBookings, getTimelineBookings, getDashboardStats
} from '../controllers/bookingController';
import { authenticate, requireApprover } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/calendar', getCalendarBookings);
router.get('/timeline', getTimelineBookings);
router.get('/stats', getDashboardStats);
router.get('/', getBookings);
router.get('/:id', getBooking);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.delete('/:id', cancelBooking);
router.put('/:id/approve', requireApprover, approveBooking);
router.put('/:id/reject', requireApprover, rejectBooking);

export default router;
