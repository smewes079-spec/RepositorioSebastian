import { Router } from 'express';
import * as configController from '../controllers/config.controller.js';

const router = Router();

router.get('/tipos-vestido', configController.tiposVestido);
router.put('/tipos-vestido/:tipo', configController.updateTipoVestido);
router.get('/sueldos', configController.sueldos);
router.put('/sueldos/:nombre', configController.updateSueldo);

export default router;
