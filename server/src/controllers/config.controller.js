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

export async function updateSueldo(req, res) {
  try {
    const data = await configService.updateSueldo(req.params.nombre, req.body);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo actualizar el sueldo' });
  }
}

export async function costosFijos(req, res) {
  res.json(await configService.listCostosFijos());
}

export async function updateCostoFijo(req, res) {
  try {
    const data = await configService.updateCostoFijo(req.params.nombre, req.body);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo actualizar el costo fijo' });
  }
}

export async function createCostoFijo(req, res) {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    const data = await configService.updateCostoFijo(nombre.trim(), req.body);
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un costo fijo con ese nombre' });
    }
    res.status(400).json({ error: 'No se pudo crear el costo fijo' });
  }
}

export async function deleteCostoFijo(req, res) {
  try {
    await configService.deleteCostoFijo(req.params.nombre);
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
