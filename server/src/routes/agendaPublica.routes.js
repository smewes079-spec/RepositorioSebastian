import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as agendaController from '../controllers/agenda.controller.js';

// Rutas PÚBLICAS (sin login) de la página /agendar. Con límite de intentos
// por IP para evitar abusos.
const router = Router();

const consultaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas consultas. Espera unos minutos e inténtalo de nuevo.' },
});

const reservaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de reserva. Escríbenos para agendar.' },
});

router.get('/config', consultaLimiter, agendaController.configPublica);
router.get('/horarios', consultaLimiter, agendaController.horarios);
router.post('/reservar', reservaLimiter, agendaController.reservar);

export default router;
