import { Router } from 'express';
import * as purchasesController from '../controllers/purchases.controller.js';

const router = Router();

router.get('/', purchasesController.index);
router.get('/resumen', purchasesController.resumen);
router.get('/sugerencia', purchasesController.sugerencia);
router.get('/:id', purchasesController.show);
router.post('/', purchasesController.create);
router.put('/:id', purchasesController.update);
router.delete('/:id', purchasesController.destroy);

export default router;
