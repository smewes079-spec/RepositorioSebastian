# CLAUDE.md

Contexto para cualquier sesión de Claude (de cualquier cuenta) que trabaje en
este repositorio. Para contexto de producto/usuario ver `README.md`; para el
flujo de "cómo pedir un cambio" ver `COMO-PEDIR-CAMBIOS.md`; para el
historial de versiones ver `CHANGELOG.md`. Este archivo es solo para
convenciones de desarrollo y decisiones de arquitectura.

## Qué es esto

App de gestión para el taller de vestidos de novia Hatton Schultz Novias
(Santiago). La usan directamente las tres socias del negocio — Sebastian
(dueño), Carolina ("Caro") y María — sin perfil técnico. Todo el desarrollo
se hace conversando en lenguaje simple en español con Claude; no hay equipo
de ingeniería aparte. Cuentas individuales, sin roles: cualquier cuenta
activa puede ver y editar todo (`server/prisma/schema.prisma` → `Usuario` no
tiene campo `rol`).

Monorepo npm workspaces: `server/` (Express + Prisma + PostgreSQL) y
`client/` (React + Vite + Tailwind). Desplegado en Render:
`https://hatton-schultz-novias.onrender.com`, servicio
`hatton-schultz-novias`, definido en `render.yaml`.

## Patrón de código del backend

Cada módulo de negocio sigue el mismo patrón de 4 capas — úsalo como molde
para cualquier módulo nuevo (el más reciente y simple para copiar es
Asesorías):

```
server/src/routes/<modulo>.routes.js        → define los endpoints REST
server/src/controllers/<modulo>.controller.js → parsea req, llama al service, responde
server/src/services/<modulo>.service.js      → lógica de negocio + Prisma
```

Montado en `server/src/index.js` con `app.use('/api/<modulo>', requireAuth, <modulo>Routes)`.
`requireAuth` (`server/src/middleware/auth.js`) solo exige sesión válida, no
chequea ningún permiso — no hay admin/staff.

Frontend: una página de listado (`client/src/pages/<Modulo>List.jsx`) y una
de formulario (`client/src/pages/<Modulo>Form.jsx`), con ruta en
`client/src/App.jsx` y entrada en `client/src/components/Sidebar.jsx`. Los
listados reutilizan los hooks compartidos `useColumnWidths`,
`useColumnFilters`, `useColumnVisibility` y el componente `FilterableHeader`
— no reinventar filtros/orden columna por columna.

## Flujo de ingresos financieros (EERR y Flujo de Caja)

`server/src/services/eerr.service.js` y `flujoCaja.service.js` agregan datos
mes a mes desde varias fuentes (Ventas, Presupuesto, GastoGeneral, Asesoria).
Si agregas una fuente nueva de ingreso o gasto:

1. Agrégala al `Promise.all` inicial del service.
2. Súmala en un `Map` por `mes` (usa `monthKeySeguro()` en `flujoCaja.service.js`,
   no `monthKey()` directo — filtra fechas corruptas/fuera de rango y las
   reporta en `anomalias` en vez de romper la tabla con décadas de filas
   vacías; ver el comentario en ese archivo para el bug histórico que esto
   corrige).
3. Agrégala a `TOTAL_VACIO`, al cálculo de `totalIngresos`/`totalEntradas`
   dentro de `filas.map`, al objeto de la fila, y al `reduce` final de `total`.
4. Replica el mismo campo en `client/src/pages/Dashboard.jsx`
   (`EERR_TOTAL_VACIO`/`FLUJO_TOTAL_VACIO`, `sumarEerr`/`sumarFlujo`, y el
   array `cols` de la tabla correspondiente).

## Autenticación y recuperación de clave

No hay flujo de "olvidé mi clave" por correo (no se envían emails de reset).
El mecanismo real es `POST /api/usuarios/:id/resetear-password` →
`usuarios.service.js: resetearPassword()`: genera una clave temporal de 10
caracteres, la hashea con bcrypt (10 rounds) y la devuelve una sola vez.
Cualquier usuaria logueada puede resetear la clave de cualquier otra desde
**Configuración → Usuarios**. Si nadie tiene sesión activa en ningún
dispositivo, no hay puerta de entrada desde la UI — hay que correr un script
puntual contra la base de producción (vía Render Shell del servicio, donde
ya están `DATABASE_URL`, `@prisma/client` y `bcryptjs` disponibles) que
replique esa misma lógica a mano.

## Flujo de versionado y shipping

Cada mejora aprobada es una versión nueva, un commit propio, documentada en
`CHANGELOG.md`. Al terminar un cambio:

1. Probar localmente antes de subir (ver sección siguiente).
2. Bump de versión en `package.json`, `server/package.json` y
   `client/package.json` (minor `x.Y.0` para features, patch `x.y.Z` para
   fixes chicos).
3. `npm install --package-lock-only` para sincronizar `package-lock.json`
   con la versión nueva.
4. Agregar entrada nueva arriba de todo en `CHANGELOG.md`, en español simple
   (sin jerga técnica — lo lee el dueño del negocio), fecha real del día.
5. `git add` de los archivos específicos tocados — nunca `git add -A`.
6. Commit descriptivo del cambio.
7. `git push` a la rama de la sesión.
8. Confirmar el deploy: sondear `https://hatton-schultz-novias.onrender.com/api/health`
   hasta que responda 200 antes de avisar que ya está en línea (Render
   tarda unos minutos en redeployar tras el push).

## Ciclo de prueba local

No hay suite de tests automatizada — se prueba a mano contra una base
Postgres local antes de cada ship:

```bash
pg_ctlcluster 16 main start
sudo -u postgres psql -c "CREATE USER hsn_user WITH PASSWORD 'hsn_password' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE hsn_db OWNER hsn_user;"
# si la migración es nueva, crear también la shadow DB:
sudo -u postgres psql -c "CREATE DATABASE hsn_db_shadow OWNER hsn_user;"
```

`server/.env` con `DATABASE_URL`, `SESSION_SECRET`, `PORT=4000`,
`CLIENT_ORIGIN=http://localhost:5173`.

Prisma CLI no soporta bien `migrate dev` de forma no interactiva en este
entorno; para generar una migración nueva:

```bash
npx prisma migrate deploy
npx prisma migrate diff --from-migrations ./prisma/migrations \
  --to-schema-datamodel ./prisma/schema.prisma \
  --shadow-database-url "$SHADOW_DATABASE_URL" --script \
  > prisma/migrations/<timestamp>_<nombre>/migration.sql
npx prisma migrate deploy
npx prisma generate
```

Levantar servidor y cliente, crear el primer usuario vía
`POST /api/auth/bootstrap` (solo funciona si la tabla `Usuario` está vacía),
probar con `curl` y/o Playwright (Chromium ya instalado en
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, Playwright en
`/opt/node22/lib/node_modules/playwright/index.mjs`). Al terminar: parar
node/vite, borrar la base y el usuario de prueba, parar postgres, borrar
`server/.env` — no dejar residuos del entorno de prueba.

## Decisiones de diseño a tener en cuenta

- Sin roles de usuario: cualquier pedido de "solo el admin puede X" requiere
  primero agregar un campo de rol al modelo `Usuario` — no existe hoy.
- `TipoVestido` (NOVIA/MADRINA/INVITADA/CIVIL) es específico de `Venta`
  (vestidos en confección). Para ingresos que no son un vestido (como
  Asesorías), no forzar esa estructura — crear un modelo propio más simple,
  sin cuotas ni `KanbanEstado`.
- El campo "Precio total negociado" en `VentaForm.jsx` ya es libremente
  editable sin restricción de backend — no asumir que hace falta construir
  eso si alguien lo pide.
- Moneda siempre CLP sin decimales. Fechas en vistas: `DD-MMM-YY`.
