import * as gastosGeneralesService from '../services/gastosGenerales.service.js';

export async function index(req, res) {
  const { categoria, mesGasto } = req.query;
  const data = await gastosGeneralesService.listGastosGenerales({ categoria, mesGasto });
  res.json(data);
}

export async function resumen(req, res) {
  const { categoria, mesGasto } = req.query;
  const data = await gastosGeneralesService.resumen({ categoria, mesGasto });
  res.json(data);
}

export async function show(req, res) {
  const data = await gastosGeneralesService.getGastoGeneral(req.params.id);
  if (!data) return res.status(404).json({ error: 'Gasto no encontrado' });
  res.json(data);
}

export async function create(req, res) {
  try {
    const data = await gastosGeneralesService.createGastoGeneral(req.body, req.user.id);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message || 'No se pudo registrar el gasto' });
  }
}

export async function update(req, res) {
  try {
    const data = await gastosGeneralesService.updateGastoGeneral(req.params.id, req.body, req.user.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'No se pudo actualizar el gasto' });
  }
}

export async function destroy(req, res) {
  try {
    await gastosGeneralesService.deleteGastoGeneral(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: 'Gasto no encontrado' });
  }
}

export async function subirComprobante(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Debes adjuntar un archivo' });
  try {
    const data = await gastosGeneralesService.guardarComprobante(req.params.id, req.file);
    res.json(data);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'No se pudo subir el comprobante' });
  }
}

export async function descargarComprobante(req, res) {
  const data = await gastosGeneralesService.getComprobante(req.params.id);
  if (!data || !data.comprobanteDatos) {
    return res.status(404).json({ error: 'Este gasto no tiene comprobante' });
  }
  res.set('Content-Type', data.comprobanteMime);
  res.set('Content-Disposition', `inline; filename="${data.comprobanteNombre}"`);
  res.send(data.comprobanteDatos);
}

export async function eliminarComprobante(req, res) {
  try {
    const data = await gastosGeneralesService.eliminarComprobante(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'No se pudo eliminar el comprobante' });
  }
}
