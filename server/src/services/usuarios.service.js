import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';

const SALT_ROUNDS = 10;
const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function generarPasswordTemporal() {
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += TEMP_PASSWORD_CHARS[Math.floor(Math.random() * TEMP_PASSWORD_CHARS.length)];
  }
  return password;
}

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export async function listUsuarios() {
  return prisma.usuario.findMany({
    select: { id: true, email: true, nombre: true, activo: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function findUsuarioByEmail(email) {
  return prisma.usuario.findUnique({ where: { email: normalizarEmail(email) } });
}

export async function createUsuarioConPassword({ email, nombre, password }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return prisma.usuario.create({
    data: { email: normalizarEmail(email), nombre: nombre.trim(), passwordHash },
    select: { id: true, email: true, nombre: true, activo: true, createdAt: true },
  });
}

export async function createUsuario({ email, nombre }) {
  const passwordTemporal = generarPasswordTemporal();
  const passwordHash = await bcrypt.hash(passwordTemporal, SALT_ROUNDS);
  const usuario = await prisma.usuario.create({
    data: { email: normalizarEmail(email), nombre: nombre.trim(), passwordHash },
    select: { id: true, email: true, nombre: true, activo: true, createdAt: true },
  });
  return { usuario, passwordTemporal };
}

export async function updateUsuario(id, { nombre, activo }) {
  const data = {};
  if (nombre !== undefined) data.nombre = nombre.trim();
  if (activo !== undefined) data.activo = !!activo;
  return prisma.usuario.update({
    where: { id },
    data,
    select: { id: true, email: true, nombre: true, activo: true, createdAt: true },
  });
}

export async function resetearPassword(id) {
  const passwordTemporal = generarPasswordTemporal();
  const passwordHash = await bcrypt.hash(passwordTemporal, SALT_ROUNDS);
  await prisma.usuario.update({ where: { id }, data: { passwordHash } });
  return { passwordTemporal };
}

export async function cambiarPassword(id, passwordActual, passwordNueva) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new Error('Usuario no encontrado');
  const coincide = await bcrypt.compare(passwordActual, usuario.passwordHash);
  if (!coincide) throw new Error('La contraseña actual no es correcta');
  if (!passwordNueva || passwordNueva.length < 6) {
    throw new Error('La contraseña nueva debe tener al menos 6 caracteres');
  }
  const passwordHash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
  await prisma.usuario.update({ where: { id }, data: { passwordHash } });
}

export async function verificarCredenciales(email, password) {
  const usuario = await findUsuarioByEmail(email);
  if (!usuario || !usuario.activo) return null;
  const coincide = await bcrypt.compare(password, usuario.passwordHash);
  if (!coincide) return null;
  return usuario;
}
