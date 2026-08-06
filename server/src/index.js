import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import authRoutes from './routes/auth.routes.js';
import ventasRoutes from './routes/ventas.routes.js';
import purchasesRoutes from './routes/purchases.routes.js';
import configRoutes from './routes/config.routes.js';
import rentabilidadRoutes from './routes/rentabilidad.routes.js';
import { requireAuth } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const clientDist = path.join(__dirname, '../../client/dist');
const serveClient = isProduction && fs.existsSync(clientDist);

const app = express();
app.set('trust proxy', 1);

if (!serveClient) {
  // En desarrollo el cliente corre en un puerto aparte (Vite) y necesita CORS.
  // En producción todo se sirve desde el mismo origen y no hace falta.
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    })
  );
}
app.use(express.json());
app.use(
  session({
    name: 'hsn.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction ? 'auto' : false,
      maxAge: 1000 * 60 * 60 * 12,
    },
  })
);

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/ventas', requireAuth, ventasRoutes);
app.use('/api/purchases', requireAuth, purchasesRoutes);
app.use('/api/config', requireAuth, configRoutes);
app.use('/api/rentabilidad', requireAuth, rentabilidadRoutes);

if (serveClient) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Hatton Schultz Novias API escuchando en puerto ${PORT}`);
});
