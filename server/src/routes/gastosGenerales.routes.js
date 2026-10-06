import { Router } from 'express';
import * as gastosGeneralesController from '../controllers/gastosGenerales.controller.js';

const router = Router();

router.get('/', gastosGeneralesController.index);
router.get('/resumen', gastosGeneralesController.resumen);
router.get('/:id', gastosGeneralesController.show);
router.post('/', gastosGeneralesController.create);
router.put('/:id', gastosGeneralesController.update);
router.delete('/:id', gastosGeneralesController.destroy);

export default router;
