import * as usuariosService from '../services/usuarios.service.js';

export async function index(req, res) {
  const usuarios = await usuariosService.listUsuarios();
  res.json(usuarios);
}

export async function create(req, res) {
  try {
    const { email, nombre } = req.body;
    if (!email || !nombre) {
      return res.status(400).json({ error: 'Falta el nombre o el correo' });
    }
    const existente = await usuariosService.findUsuarioByEmail(email);
    if (existente) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    }
    const { usuario, passwordTemporal } = await usuariosService.createUsuario({ email, nombre });
    res.status(201).json({ usuario, passwordTemporal });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo crear el usuario' });
  }
}

export async function update(req, res) {
  try {
    const usuario = await usuariosService.updateUsuario(req.params.id, req.body);
    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo actualizar el usuario' });
  }
}

export async function resetearPassword(req, res) {
  try {
    const { passwordTemporal } = await usuariosService.resetearPassword(req.params.id);
    res.json({ passwordTemporal });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo restablecer la contraseña' });
  }
}

export async function cambiarPassword(req, res) {
  try {
    const { passwordActual, passwordNueva } = req.body;
    await usuariosService.cambiarPassword(req.user.id, passwordActual, passwordNueva);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message || 'No se pudo cambiar la contraseña' });
  }
}
