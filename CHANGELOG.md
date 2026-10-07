# Historial de versiones

Cada mejora aprobada de la app queda registrada acá como una versión nueva, siempre más alta que la anterior. Si algo falla, se puede volver a cualquier versión anterior con `git checkout vX.Y.Z`.

## Cómo se versiona

- El número de versión (ej. `v1.2.0`) se ve abajo del menú lateral de la app, para saber cuál está en línea.
- Cada mejora nueva sube el número del medio (ej. `v1.1.0` → `v1.2.0`). Un arreglo chico sube el número final (ej. `v1.2.0` → `v1.2.1`).
- Cada versión queda en su propio commit de git (con el número de versión en el mensaje), así que nunca se pierde una versión anterior y se puede volver a cualquiera revisando el historial en GitHub.

## v1.15.0 — 2026-10-07

- **Ventas**: las columnas de fecha (Fecha venta, Fecha evento, Entrega comprometida) ahora se pueden ordenar de mayor a menor o viceversa haciendo clic en el encabezado — un segundo clic invierte el orden. Por defecto se muestran ordenadas por Fecha venta, de más reciente a más antigua.

## v1.14.0 — 2026-10-07

- **Importar Excel en Gastos Generales**: ya se puede cargar gastos generales en lote desde una planilla Excel/CSV, igual que ya se podía con Insumos — botón "Importar Excel" en el listado, con plantilla descargable.
- **Prorrateo de insumos más preciso al importar**: cuando una compra de insumos se importa con "Prorrateo" (sin elegir vestidos a mano), ahora se reparte entre las ventas del mismo mes de la compra en vez de las ventas activas hoy — importante para cargar historial antiguo sin ensuciar la rentabilidad de los vestidos actuales.

## v1.13.0 — 2026-10-07

- Gastos Generales: nueva categoría "Impuestos, legal y bancos" (trámites, notaría, asesoría tributaria, comisiones bancarias, impuestos) — para ordenar el historial de gastos que se está cargando.

## v1.12.1 — 2026-10-07

- Las cotizaciones Aceptadas o Rechazadas ahora se pueden editar (antes quedaban completamente bloqueadas). Si la cotización ya generó una venta, se muestra un aviso recordando que los cambios no se reflejan automáticamente en esa venta. Los botones de Enviar/Aceptar/Rechazar/Eliminar siguen sin aparecer en esos estados.

## v1.12.0 — 2026-10-06

- **Logo real del taller**: se reemplazó el monograma aproximado (dibujado con letras superpuestas, ya que no se contaba con el archivo original de la marca) por el logo real del taller, provisto por el usuario. Se actualizó en las 4 páginas del PDF de cotización, en el menú lateral, en la pantalla de inicio de sesión y en el ícono de la pestaña del navegador. El resto del formato (colores, tipografías, textos, estructura) no cambió.

## v1.11.0 — 2026-10-06

- **Código de venta automático**: en Ventas, el "Código único" ahora se autocompleta solo con la inicial del nombre + inicial del apellido + fecha del evento (ej. "Florencia Vasquez" + 05/06/2027 → `FV050627`), apenas se completan el nombre y la fecha del evento. Sigue siendo editable a mano, y si el código coincide con uno ya existente se agrega automáticamente un sufijo (`-2`, `-3`, etc.) para que nunca se repita. Al aceptar una cotización, la venta resultante también usa este formato en vez del anterior (`COT-xxxxxx`).
- **Proveedor en Registro de insumos**: nuevo campo opcional "Proveedor" para anotar dónde se compró cada insumo — disponible en el formulario, en la columna del listado y en la plantilla Excel de importación (columna PROVEEDOR, opcional).

## v1.10.0 — 2026-10-06

- **Gastos generales**: nuevo registro para café, estacionamiento, mobiliario, maniquíes y otros gastos que no son insumos de vestidos — separado del Registro de insumos (que sigue siendo solo para materiales asignados a un vestido) y de Costos Fijos (montos recurrentes mensuales). Cada gasto se registra con fecha, categoría, descripción y monto, y se refleja automáticamente en el Estado de Resultados y el Flujo de Caja del mes en que ocurrió, sin afectar la rentabilidad por vestido. Nuevo ítem "Gastos generales" en el menú, bajo Costos.

## v1.9.0 — 2026-10-06

- **Historial de sueldos y costos fijos**: en Configuración, cada modista y cada costo fijo (arriendo, agua/luz, etc.) ahora puede tener varios valores en el tiempo en vez de uno solo. Al agregar un valor nuevo (ej. porque subió el arriendo), el anterior queda guardado como historial — no se pierde — y el Estado de Resultados, el Flujo de Caja y la rentabilidad por vestido usan automáticamente el valor que correspondía a cada mes según su fecha. Se puede corregir o eliminar una entrada puntual del historial, o eliminar una modista/costo por completo.
- **Proyección automática de ventas en Presupuesto**: junto al botón que sugiere con el precio estándar, ahora hay un segundo botón que sugiere la cantidad y el monto según el promedio real de ventas de ese tipo de vestido en los meses anteriores con datos. El botón indica claramente cuántos meses y qué rango de fechas usó para el cálculo, y la sugerencia sigue siendo editable antes de guardar.

## v1.8.0 — 2026-10-02

- **"Mover a Cotización" ahora funciona para cualquier venta**, no solo las que vinieron de una cotización aceptada — incluidas las ventas de la base de datos importada. Si la venta nunca tuvo cotización, se crea una nueva automáticamente con sus datos (nombre, tipo, fecha de evento, monto) marcada como Rechazada; el correo de la clienta queda vacío y se puede completar después si hace falta reenviarla.
- El correo de la clienta en Cotizaciones ya no es obligatorio para guardar — solo se pide al momento de enviarla por correo, con un aviso claro si falta.

## v1.7.0 — 2026-10-02

- **Ventas**: nuevo botón "Volver a Cotización" para cuando una clienta se retracta después de haber aceptado. Solo aparece en ventas que vienen de una cotización aceptada. Elimina el registro de la venta (cuotas y compras de insumos asignadas incluidas, con advertencia clara antes de confirmar) y la cotización original vuelve a quedar activa, marcada como Rechazada, lista para editarse o gestionarse de nuevo.

## v1.6.1 — 2026-10-02

- Corrige un espacio vacío grande entre el menú lateral y el contenido que apareció en monitores anchos con el cambio de v1.6.0. El contenido ahora queda pegado al menú (a la distancia normal de siempre) y, si sobra espacio en pantallas muy grandes, se acumula al lado derecho en vez de separar el contenido del menú.

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
