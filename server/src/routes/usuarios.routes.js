import { Router } from 'express';
import * as usuariosController from '../controllers/usuarios.controller.js';

const router = Router();

router.get('/', usuariosController.index);
router.post('/', usuariosController.create);
router.put('/:id', usuariosController.update);
router.post('/:id/resetear-password', usuariosController.resetearPassword);
router.post('/cambiar-password', usuariosController.cambiarPassword);

export default router;
