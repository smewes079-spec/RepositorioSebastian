# Historial de versiones

Cada mejora aprobada de la app queda registrada acá como una versión nueva, siempre más alta que la anterior. Si algo falla, se puede volver a cualquier versión anterior con `git checkout vX.Y.Z`.

## Cómo se versiona

- El número de versión (ej. `v1.2.0`) se ve abajo del menú lateral de la app, para saber cuál está en línea.
- Cada mejora nueva sube el número del medio (ej. `v1.1.0` → `v1.2.0`). Un arreglo chico sube el número final (ej. `v1.2.0` → `v1.2.1`).
- Cada versión queda en su propio commit de git (con el número de versión en el mensaje), así que nunca se pierde una versión anterior y se puede volver a cualquiera revisando el historial en GitHub.

## v1.6.0 — 2026-10-02

- **Columnas redimensionables**: en Ventas, Compras, Cotizaciones y Rentabilidad por vestido ahora se puede ajustar el ancho de cada columna arrastrando su borde derecho (igual que en Excel). El ancho elegido queda guardado y persiste al recargar la página. Botón "Restablecer anchos de columnas" para volver a los valores por defecto.
- **Proporción pantalla/menú**: el contenido ya no se estira sin límite en monitores grandes — se corrigió para que mantenga una proporción equilibrada frente al menú lateral en cualquier tamaño de pantalla.

## v1.5.0 — 2026-10-02

- **Ventas**: nuevo campo "Fecha de entrega comprometida" — la fecha objetivo para tener el vestido terminado, pensada para planificar producción. Es editable y distinta de la fecha real de entrega (que sigue siendo automática al marcar "Entregado"; ahora también se muestra como referencia). Se puede ver, ordenar y filtrar como columna nueva en el listado de Ventas.

## v1.4.1 — 2026-10-02

- Configuración → Sueldos de modistas: ahora se puede agregar una modista nueva o eliminar una existente, igual que ya se podía con los costos fijos.

## v1.4.0 — 2026-10-02

- **Cuentas individuales**: cada persona entra con su propio correo y contraseña en vez de compartir una sola clave. La primera vez que se abre la app, la pantalla de login pide crear la cuenta del administrador; las demás se crean después desde Configuración → Usuarios (se genera una contraseña temporal que hay que enviarle a esa persona; ella puede cambiarla después desde su propia sesión).
- **Trazabilidad**: cada venta, compra y cotización ahora registra quién la creó y quién hizo la última edición, visible en el detalle de cada una.
- Se puede desactivar o reactivar una cuenta, y restablecer su contraseña, desde Configuración → Usuarios.
- Se mantiene el límite de intentos de inicio de sesión ya existente.

## v1.3.1 — 2026-09-29

- Se agrega `COMO-PEDIR-CAMBIOS.md`: guía en español simple sobre cómo reportar un error o pedir una función nueva, enlazada desde el README.

## v1.3.0 — 2026-09-29

- Seguridad: se bloquean los intentos de inicio de sesión después de 10 intentos fallidos en 15 minutos, para que nadie pueda probar contraseñas al voleo.
- El servidor ahora revisa que estén configuradas todas las variables necesarias (base de datos, clave de sesión, contraseña) antes de arrancar, y avisa claramente cuál falta en vez de fallar de forma confusa.
- Se elimina una clave de sesión insegura que quedaba como respaldo si faltaba la configuración.

## v1.2.0 — 2026-09-29

- Seguridad: la contraseña de acceso ya no queda escrita en el código (`render.yaml`); ahora se administra solo desde el panel de Render. **Se recomienda cambiar la contraseña actual**, porque quedó expuesta en versiones anteriores del código.
- Se actualiza `multer` (usado en las importaciones Excel) para corregir una vulnerabilidad de seguridad detectada.

## v1.1.1 — 2026-09-15

- Se actualiza `render.yaml` para reflejar que la base de datos pasa a un plan pago de Render (el usuario decidió pagar para poder seguir probando la app con datos reales).

## v1.1.0 — 2026-09-15

- Se puede importar cotizaciones desde una planilla Excel/CSV (igual que ya se podía con Ventas y Compras). Botón "Importar Excel" en el listado de Cotizaciones.

## v1.0.0 — 2026-09-15

Punto de partida: todo lo construido hasta hoy.

- **Ventas**: registro, seguimiento en tablero (kanban), cuotas de pago, importación y exportación Excel.
- **Compras**: registro de insumos con asignación de costo (directa o prorrateada) a los vestidos, importación y exportación Excel.
- **Cotizaciones**: creación, envío por correo (con PDF con el diseño real del taller), selección de remitente (María o Carolina, con copia a la otra), estados (Pendiente/Enviada/Aceptada/Rechazada), conversión automática a venta al aceptarse, edición y eliminación masiva.
- **Rentabilidad**: cálculo de rentabilidad por vestido.
- **Dashboard**: resumen financiero general.
- **Configuración**: costos estándar por tipo de vestido, sueldos, costos fijos.
