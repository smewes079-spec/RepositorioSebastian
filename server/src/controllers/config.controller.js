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
