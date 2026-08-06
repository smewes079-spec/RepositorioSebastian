import { Router } from 'express';
import * as costeoService from '../services/costeo.service.js';

const router = Router();

router.get('/por-tipo', async (req, res) => {
  res.json(await costeoService.getRentabilidadPorTipo());
});

router.get('/detalle', async (req, res) => {
  res.json(await costeoService.getRentabilidadDetalle());
});

export default router;
