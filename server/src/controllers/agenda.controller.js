import * as agendaService from '../services/agenda.service.js';

// ---- Página pública /agendar (sin login) ----

export async function configPublica(req, res) {
  try {
    res.json(await agendaService.configPublica());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo cargar la agenda' });
  }
}

export async function horarios(req, res) {
  try {
    const { segmento, fechaEvento } = req.query;
    res.json(await agendaService.horariosDisponibles({ segmento, fechaEvento }));
  } catch (err) {
    console.error(err);
    res.status(503).json({ error: 'No pudimos revisar la disponibilidad en este momento. Inténtalo de nuevo en unos minutos.' });
  }
}

export async function reservar(req, res) {
  // Campo trampa: invisible para las personas; los bots lo rellenan.
  if (req.body?.sitioWeb) return res.status(201).json({ ok: true });
  try {
    const { segmento, fechaEvento, inicio, nombre, email, telefono } = req.body || {};
    const cita = await agendaService.reservar({ segmento, fechaEvento, inicio, nombre, email, telefono });
    res.status(201).json({ ok: true, cita });
  } catch (err) {
    console.error(err);
    if (err.publico) return res.status(err.status || 400).json({ error: err.message });
    res.status(503).json({ error: 'No pudimos confirmar tu hora en este momento. Inténtalo de nuevo o escríbenos.' });
  }
}

// ---- Configuración interna (con login) ----

export async function getConfig(req, res) {
  res.json(await agendaService.getConfigAgenda());
}

export async function updateConfig(req, res) {
  try {
    res.json(await agendaService.updateConfigAgenda(req.body || {}));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'No se pudo guardar la configuración de la agenda' });
  }
}
