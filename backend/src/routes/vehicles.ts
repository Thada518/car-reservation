import { Router } from 'express';
import { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle, getVehicleAvailability } from '../controllers/vehicleController';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.get('/', optionalAuthenticate, getVehicles);
router.get('/availability', optionalAuthenticate, getVehicleAvailability);
router.get('/:id', optionalAuthenticate, getVehicle);
router.post('/', requireAdmin, createVehicle);
router.put('/:id', requireAdmin, updateVehicle);
router.delete('/:id', requireAdmin, deleteVehicle);

export default router;
