import { Router } from 'express';
import {
  getBookings, getBooking, createBooking, updateBooking,
  cancelBooking, approveBooking, rejectBooking, unapproveBooking,
  getCalendarBookings, getTimelineBookings, getDashboardStats
} from '../controllers/bookingController';
import { authenticate, optionalAuthenticate, requireApprover } from '../middleware/auth';

const router = Router();
router.get('/calendar', optionalAuthenticate, getCalendarBookings);
router.get('/timeline', optionalAuthenticate, getTimelineBookings);
router.get('/stats', authenticate, getDashboardStats);
router.get('/', optionalAuthenticate, getBookings);
router.get('/:id', optionalAuthenticate, getBooking);
router.post('/', authenticate, createBooking);
router.put('/:id', authenticate, updateBooking);
router.delete('/:id', authenticate, cancelBooking);
router.put('/:id/approve', authenticate, requireApprover, approveBooking);
router.put('/:id/unapprove', authenticate, requireApprover, unapproveBooking);
router.put('/:id/reject', authenticate, requireApprover, rejectBooking);

export default router;
