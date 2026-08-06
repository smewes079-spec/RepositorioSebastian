import * as ventasService from '../services/ventas.service.js';

export async function index(req, res) {
  const { tipo, estado, mesVenta, mesEvento, search } = req.query;
  const ventas = await ventasService.listVentas({ tipo, estado, mesVenta, mesEvento, search });
  res.json(ventas);
}

export async function show(req, res) {
  const venta = await ventasService.getVenta(req.params.id);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  res.json(venta);
}

export async function create(req, res) {
  try {
    const venta = await ventasService.createVenta(req.body);
    res.status(201).json(venta);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'El código de venta ya existe' });
    }
    console.error(err);
    res.status(400).json({ error: 'No se pudo crear la venta' });
  }
}

export async function update(req, res) {
  try {
    const venta = await ventasService.updateVenta(req.params.id, req.body);
    res.json(venta);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'El código de venta ya existe' });
    }
    console.error(err);
    res.status(400).json({ error: 'No se pudo actualizar la venta' });
  }
}

export async function destroy(req, res) {
  try {
    await ventasService.deleteVenta(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: 'Venta no encontrada' });
  }
}

export async function moveKanban(req, res) {
  try {
    const venta = await ventasService.moveKanban(req.params.id, req.body.kanbanEstado);
    res.json(venta);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo mover la venta' });
  }
}

export async function resumen(req, res) {
  const { tipo, estado, mesVenta, mesEvento, search } = req.query;
  const data = await ventasService.resumen({ tipo, estado, mesVenta, mesEvento, search });
  res.json(data);
}
