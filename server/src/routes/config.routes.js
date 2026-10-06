import { Router } from 'express';
import * as configController from '../controllers/config.controller.js';

const router = Router();

router.get('/tipos-vestido', configController.tiposVestido);
router.put('/tipos-vestido/:tipo', configController.updateTipoVestido);

router.get('/sueldos', configController.sueldos);
router.post('/sueldos', configController.createSueldo);
router.put('/sueldos/historial/:id', configController.updateSueldoHistorial);
router.delete('/sueldos/historial/:id', configController.deleteSueldoHistorial);
router.delete('/sueldos/nombre/:nombre', configController.deleteSueldoNombre);

router.get('/costos-fijos', configController.costosFijos);
router.post('/costos-fijos', configController.createCostoFijo);
router.put('/costos-fijos/historial/:id', configController.updateCostoFijoHistorial);
router.delete('/costos-fijos/historial/:id', configController.deleteCostoFijoHistorial);
router.delete('/costos-fijos/nombre/:nombre', configController.deleteCostoFijoNombre);

router.get('/financiero', configController.financiero);
router.put('/financiero', configController.updateFinanciero);

export default router;
