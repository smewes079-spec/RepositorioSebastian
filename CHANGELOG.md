# Historial de versiones

Cada mejora aprobada de la app queda registrada acá como una versión nueva, siempre más alta que la anterior. Si algo falla, se puede volver a cualquier versión anterior con `git checkout vX.Y.Z`.

## Cómo se versiona

- El número de versión (ej. `v1.2.0`) se ve abajo del menú lateral de la app, para saber cuál está en línea.
- Cada mejora nueva sube el número del medio (ej. `v1.1.0` → `v1.2.0`). Un arreglo chico sube el número final (ej. `v1.2.0` → `v1.2.1`).
- Cada versión queda marcada en el repositorio de GitHub (un "tag"), así que nunca se pierde una versión anterior.

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
