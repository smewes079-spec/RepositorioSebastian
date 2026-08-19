import { Router } from 'express';
import * as cotizacionesController from '../controllers/cotizaciones.controller.js';

const router = Router();

router.get('/', cotizacionesController.index);
router.get('/:id', cotizacionesController.show);
router.get('/:id/pdf', cotizacionesController.pdf);
router.post('/', cotizacionesController.create);
router.put('/:id', cotizacionesController.update);
router.delete('/:id', cotizacionesController.destroy);
router.post('/:id/enviar', cotizacionesController.enviar);
router.post('/:id/aceptar', cotizacionesController.aceptar);
router.post('/:id/rechazar', cotizacionesController.rechazar);

export default router;
