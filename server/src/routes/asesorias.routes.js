import { Router } from 'express';
import * as asesoriasController from '../controllers/asesorias.controller.js';

const router = Router();

router.get('/', asesoriasController.index);
router.get('/resumen', asesoriasController.resumen);
router.get('/:id', asesoriasController.show);
router.post('/', asesoriasController.create);
router.put('/:id', asesoriasController.update);
router.delete('/:id', asesoriasController.destroy);

export default router;
