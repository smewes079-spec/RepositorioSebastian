# Hatton Schultz Novias

Aplicación de gestión para el taller de vestidos de novia Hatton Schultz
Novias (Santiago, Chile). Un solo nivel de acceso: todas las usuarias ven
todo. Aplicación de escritorio (desktop-first).

## Stack

- **Frontend:** React + Vite + Tailwind CSS, React Router, lucide-react
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL + Prisma ORM
- **Autenticación:** sesión única compartida (sin roles), `express-session`

## Estado del proyecto

- ✅ **Módulo 1 — Registro de Ventas y Clientas**: listado con filtros
  (tipo, estado, mes de venta, mes de evento, búsqueda), resumen de
  totales, alta/edición de ventas, plan de pagos 100% libre por cuotas
  (monto y fecha propios), cálculo automático de saldo pendiente y %
  cobrado, importación desde CSV.
- 🔜 Módulo 2 — Dashboard financiero (EERR devengado, flujo de caja,
  presupuesto de ventas)
- 🔜 Módulo 3 — Producción (tablero kanban)
- 🔜 Módulo 4 — Agenda y Google Calendar

## Estructura

```
server/   API REST (Express + Prisma)
client/   Aplicación web (React + Vite + Tailwind)
```

## Setup

### 1. Base de datos PostgreSQL

Crea una base de datos y un usuario (ajusta credenciales si lo deseas):

```sql
CREATE USER hsn_user WITH PASSWORD 'hsn_password' CREATEDB;
CREATE DATABASE hsn_db OWNER hsn_user;
```

### 2. Backend

```bash
cd server
cp .env.example .env   # ajusta DATABASE_URL, APP_PASSWORD, etc.
npm install
npm run prisma:migrate  # crea las tablas
npm run dev              # http://localhost:4000
```

Variables de entorno relevantes (`server/.env`):

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | conexión a PostgreSQL |
| `PORT` | puerto de la API (default 4000) |
| `SESSION_SECRET` | secreto de las cookies de sesión |
| `APP_PASSWORD` | contraseña única de acceso a la app |
| `CLIENT_ORIGIN` | origen permitido para CORS |

### 3. Frontend

```bash
cd client
npm install
npm run dev   # http://localhost:5173
```

El cliente proxea `/api/*` hacia `http://localhost:4000` (ver
`client/vite.config.js`), por lo que no hace falta configurar CORS en
desarrollo si se usa el proxy incluido.

### 4. Carga de historial inicial

El historial de ventas (Mar-26 a Ago-26) se carga desde la propia
aplicación: **Ventas → Importar CSV**. Columnas esperadas:

```
CÓDIGO, NOMBRE CLIENTA, TIPO, ESTADO, FECHA VENTA, FECHA EVENTO,
TOTAL VENTA, TOTAL PAGADO, DEUDA, PAGO 1, FECHA, PAGO 2, FECHA 2,
PAGO 3, FECHA 3
```

Si el código de una venta ya existe, el importador la actualiza en
lugar de duplicarla.

## Paleta de diseño

| Uso | Color |
|---|---|
| Sidebar / Header | `#1A1A2E` |
| Acento principal | `#C9A96E` |
| Fondo principal | `#FAFAF8` |
| Fondo tarjetas | `#FFFFFF` |
| Texto principal | `#2C2420` |
| Logo (blush) | `#CEC6C3` |
| Alerta positiva | `#5C8C6A` |
| Alerta negativa | `#A85C52` |

Moneda: CLP sin decimales (`$#,##0`). Fechas: `DD-MMM-YY` (ej.
`04-Ago-26`).
