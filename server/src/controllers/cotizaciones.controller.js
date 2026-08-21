import * as cotizacionesService from '../services/cotizaciones.service.js';

export async function index(req, res) {
  const { estado, tipo, search } = req.query;
  const cotizaciones = await cotizacionesService.listCotizaciones({ estado, tipo, search });
  res.json(cotizaciones);
}

export async function show(req, res) {
  const cotizacion = await cotizacionesService.getCotizacion(req.params.id);
  if (!cotizacion) return res.status(404).json({ error: 'Cotización no encontrada' });
  res.json(cotizacion);
}

export async function create(req, res) {
  try {
    const cotizacion = await cotizacionesService.createCotizacion(req.body);
    res.status(201).json(cotizacion);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo crear la cotización' });
  }
}

export async function update(req, res) {
  try {
    const cotizacion = await cotizacionesService.updateCotizacion(req.params.id, req.body);
    res.json(cotizacion);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo actualizar la cotización' });
  }
}

export async function destroy(req, res) {
  try {
    await cotizacionesService.deleteCotizacion(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: 'Cotización no encontrada' });
  }
}

export async function enviar(req, res) {
  try {
    const cotizacion = await cotizacionesService.enviarCotizacion(req.params.id, req.body?.mensaje);
    res.json(cotizacion);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'No se pudo enviar la cotización' });
  }
}

export async function aceptar(req, res) {
  try {
    const resultado = await cotizacionesService.aceptarCotizacion(req.params.id);
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'No se pudo aceptar la cotización' });
  }
}

export async function rechazar(req, res) {
  try {
    const cotizacion = await cotizacionesService.rechazarCotizacion(req.params.id);
    res.json(cotizacion);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'No se pudo rechazar la cotización' });
  }
}

export async function pdf(req, res) {
  try {
    const buffer = await cotizacionesService.descargarCotizacionPdf(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="cotizacion-${req.params.id.slice(-8)}.pdf"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: err.message || 'Cotización no encontrada' });
  }
}
