import * as asesoriasService from '../services/asesorias.service.js';

export async function index(req, res) {
  const { mes } = req.query;
  const data = await asesoriasService.listAsesorias({ mes });
  res.json(data);
}

export async function resumen(req, res) {
  const { mes } = req.query;
  const data = await asesoriasService.resumen({ mes });
  res.json(data);
}

export async function show(req, res) {
  const data = await asesoriasService.getAsesoria(req.params.id);
  if (!data) return res.status(404).json({ error: 'Asesoría no encontrada' });
  res.json(data);
}

export async function create(req, res) {
  try {
    const data = await asesoriasService.createAsesoria(req.body, req.user.id);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message || 'No se pudo registrar la asesoría' });
  }
}

export async function update(req, res) {
  try {
    const data = await asesoriasService.updateAsesoria(req.params.id, req.body, req.user.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'No se pudo actualizar la asesoría' });
  }
}

export async function destroy(req, res) {
  try {
    await asesoriasService.deleteAsesoria(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: 'Asesoría no encontrada' });
  }
}
