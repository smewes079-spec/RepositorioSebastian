import * as configService from '../services/config.service.js';

export async function tiposVestido(req, res) {
  res.json(await configService.listTiposVestido());
}

export async function updateTipoVestido(req, res) {
  try {
    const data = await configService.updateTipoVestido(req.params.tipo, req.body);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo actualizar la configuración' });
  }
}

export async function sueldos(req, res) {
  res.json(await configService.listSueldos());
}

export async function createSueldo(req, res) {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    const data = await configService.addSueldoHistorial(nombre.trim(), req.body);
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un sueldo con ese nombre y esa fecha de inicio' });
    }
    res.status(400).json({ error: 'No se pudo agregar el sueldo' });
  }
}

export async function updateSueldoHistorial(req, res) {
  try {
    const data = await configService.updateSueldoHistorialEntry(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un sueldo con ese nombre y esa fecha de inicio' });
    }
    res.status(400).json({ error: 'No se pudo actualizar el sueldo' });
  }
}

export async function deleteSueldoHistorial(req, res) {
  try {
    await configService.deleteSueldoHistorialEntry(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: 'Entrada de sueldo no encontrada' });
  }
}

export async function deleteSueldoNombre(req, res) {
  try {
    await configService.deleteSueldoNombre(req.params.nombre);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: 'Sueldo no encontrado' });
  }
}

export async function costosFijos(req, res) {
  res.json(await configService.listCostosFijos());
}

export async function createCostoFijo(req, res) {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    const data = await configService.addCostoFijoHistorial(nombre.trim(), req.body);
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un costo fijo con ese nombre y esa fecha de inicio' });
    }
    res.status(400).json({ error: 'No se pudo crear el costo fijo' });
  }
}

export async function updateCostoFijoHistorial(req, res) {
  try {
    const data = await configService.updateCostoFijoHistorialEntry(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un costo fijo con ese nombre y esa fecha de inicio' });
    }
    res.status(400).json({ error: 'No se pudo actualizar el costo fijo' });
  }
}

export async function deleteCostoFijoHistorial(req, res) {
  try {
    await configService.deleteCostoFijoHistorialEntry(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: 'Entrada de costo fijo no encontrada' });
  }
}

export async function deleteCostoFijoNombre(req, res) {
  try {
    await configService.deleteCostoFijoNombre(req.params.nombre);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: 'Costo fijo no encontrado' });
  }
}

export async function financiero(req, res) {
  res.json(await configService.getFinanciero());
}

export async function updateFinanciero(req, res) {
  try {
    const data = await configService.updateFinanciero(req.body);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudieron actualizar los supuestos financieros' });
  }
}
