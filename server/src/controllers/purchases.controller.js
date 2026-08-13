import * as purchasesService from '../services/purchases.service.js';

export async function index(req, res) {
  const { categoria, tipoAsignacion, mesCompra } = req.query;
  const data = await purchasesService.listPurchases({ categoria, tipoAsignacion, mesCompra });
  res.json(data);
}

export async function resumen(req, res) {
  const { categoria, tipoAsignacion, mesCompra } = req.query;
  const data = await purchasesService.resumen({ categoria, tipoAsignacion, mesCompra });
  res.json(data);
}

export async function show(req, res) {
  const data = await purchasesService.getPurchase(req.params.id);
  if (!data) return res.status(404).json({ error: 'Compra no encontrada' });
  res.json(data);
}

export async function create(req, res) {
  try {
    const data = await purchasesService.createPurchase(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message || 'No se pudo registrar la compra' });
  }
}

export async function update(req, res) {
  try {
    const data = await purchasesService.updatePurchase(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'No se pudo actualizar la compra' });
  }
}

export async function destroy(req, res) {
  try {
    await purchasesService.deletePurchase(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: 'Compra no encontrada' });
  }
}
