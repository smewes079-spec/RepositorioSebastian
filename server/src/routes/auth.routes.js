import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();

// Como todos comparten una sola contraseña, limitamos los intentos para que
// nadie pueda probar contraseñas al voleo.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
});

router.post('/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  req.session.authenticated = true;
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('hsn.sid');
    res.json({ ok: true });
  });
});

router.get('/session', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

export default router;
