import { Router } from 'express';
import { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle, getVehicleAvailability } from '../controllers/vehicleController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', getVehicles);
router.get('/availability', getVehicleAvailability);
router.get('/:id', getVehicle);
router.post('/', requireAdmin, createVehicle);
router.put('/:id', requireAdmin, updateVehicle);
router.delete('/:id', requireAdmin, deleteVehicle);

export default router;
