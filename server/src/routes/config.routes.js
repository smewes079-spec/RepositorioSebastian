import { Router } from 'express';
import * as configController from '../controllers/config.controller.js';

const router = Router();

router.get('/tipos-vestido', configController.tiposVestido);
router.put('/tipos-vestido/:tipo', configController.updateTipoVestido);
router.get('/sueldos', configController.sueldos);
router.put('/sueldos/:nombre', configController.updateSueldo);
router.get('/costos-fijos', configController.costosFijos);
router.post('/costos-fijos', configController.createCostoFijo);
router.put('/costos-fijos/:nombre', configController.updateCostoFijo);
router.delete('/costos-fijos/:nombre', configController.deleteCostoFijo);
router.get('/financiero', configController.financiero);
router.put('/financiero', configController.updateFinanciero);

export default router;
