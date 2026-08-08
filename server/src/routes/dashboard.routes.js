import { Router } from 'express';
import { getEERR } from '../services/eerr.service.js';
import { getFlujoCaja } from '../services/flujoCaja.service.js';
import { getKPIs } from '../services/dashboard.service.js';
import * as presupuestoService from '../services/presupuesto.service.js';

const router = Router();

router.get('/kpis', async (req, res) => {
  res.json(await getKPIs());
});

router.get('/eerr', async (req, res) => {
  res.json(await getEERR());
});

router.get('/flujo-caja', async (req, res) => {
  res.json(await getFlujoCaja());
});

router.get('/presupuesto', async (req, res) => {
  res.json(await presupuestoService.listPresupuesto());
});

router.post('/presupuesto', async (req, res) => {
  try {
    const data = await presupuestoService.createPresupuesto(req.body);
    res.status(201).json(data);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un presupuesto para ese tipo y mes' });
    }
    res.status(err.status || 400).json({ error: err.message || 'No se pudo crear el presupuesto' });
  }
});

router.put('/presupuesto/:id', async (req, res) => {
  try {
    const data = await presupuestoService.updatePresupuesto(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un presupuesto para ese tipo y mes' });
    }
    res.status(err.status || 400).json({ error: err.message || 'No se pudo actualizar el presupuesto' });
  }
});

router.delete('/presupuesto/:id', async (req, res) => {
  try {
    await presupuestoService.deletePresupuesto(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: 'Presupuesto no encontrado' });
  }
});

export default router;
