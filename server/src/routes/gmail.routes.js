import { Router } from 'express';
import * as gmailController from '../controllers/gmail.controller.js';

const router = Router();

router.get('/estado', gmailController.estado);
router.get('/conectar/:remitente', gmailController.conectar);
router.get('/callback', gmailController.callback);
router.delete('/:remitente', gmailController.desconectar);

export default router;
