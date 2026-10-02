import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { verificarCredenciales, findUsuarioByEmail, createUsuarioConPassword } from '../services/usuarios.service.js';

const router = Router();

// Como cada cuenta tiene su propia contraseña, igual limitamos los intentos
// por si alguien intenta adivinar la de otra persona.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(401).json({ error: 'Ingresa tu correo y tu contraseña' });
  }
  const usuario = await verificarCredenciales(email, password);
  if (!usuario) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }
  req.session.userId = usuario.id;
  req.session.userNombre = usuario.nombre;
  req.session.userEmail = usuario.email;
  res.json({ ok: true, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email } });
});

// Solo funciona mientras no exista ningún usuario todavía (primer arranque).
// Una vez creado el primer usuario, se usa la pantalla de Usuarios (dentro de
// Configuración) para crear las demás cuentas — este endpoint queda inútil
// para siempre después de ese primer uso.
router.post('/bootstrap', loginLimiter, async (req, res) => {
  try {
    const totalUsuarios = await prisma.usuario.count();
    if (totalUsuarios > 0) {
      return res.status(403).json({
        error: 'Ya existe al menos un usuario. Pide que alguien con cuenta te cree una desde Configuración → Usuarios.',
      });
    }
    const { email, nombre, password } = req.body;
    if (!email || !nombre || !password || password.length < 6) {
      return res.status(400).json({ error: 'Completa nombre, correo y una contraseña de al menos 6 caracteres' });
    }
    const usuario = await createUsuarioConPassword({ email, nombre, password });
    req.session.userId = usuario.id;
    req.session.userNombre = usuario.nombre;
    req.session.userEmail = usuario.email;
    res.status(201).json({ ok: true, usuario });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo crear el primer usuario' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('hsn.sid');
    res.json({ ok: true });
  });
});

router.get('/session', async (req, res) => {
  if (!req.session?.userId) {
    const totalUsuarios = await prisma.usuario.count();
    return res.json({ authenticated: false, necesitaBootstrap: totalUsuarios === 0 });
  }
  // Se revisa en vivo (no solo lo que quedó guardado en la sesión) para que si
  // alguien desactiva una cuenta, esa persona quede fuera en su próxima carga.
  const usuario = await findUsuarioByEmail(req.session.userEmail);
  if (!usuario || !usuario.activo) {
    req.session.destroy(() => {});
    return res.json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
  });
});

export default router;
