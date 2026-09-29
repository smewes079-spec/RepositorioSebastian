# Cómo reportar un error o pedir un cambio

Esta app la mantiene Claude (asistente de IA) conversando directamente con el dueño en el chat de trabajo — no hay un sistema de tickets ni un equipo de soporte aparte. Esta página explica cómo pedir ayuda para que la respuesta sea rápida y clara.

## Si algo no funciona (reportar un error)

Cuéntalo en el chat con estos datos, en lo posible:

1. **Qué estabas haciendo** — ej. "Estaba creando una cotización nueva".
2. **Qué pasó** — ej. "Al hacer clic en Guardar, no pasó nada" o "Apareció un mensaje de error".
3. **Qué esperabas que pasara** en cambio.
4. **Una captura de pantalla**, si es posible — ayuda muchísimo a encontrar el problema rápido.
5. **Quién lo vio** (tú, Carolina o María) y aproximadamente cuándo.

Con esa información, se revisa el código, se corrige, se prueba, y se sube como una versión nueva (queda anotada en `CHANGELOG.md`). Render la pone en línea sola en unos minutos. Para errores urgentes (la app no carga, no se puede vender), avísalo como prioritario.

## Si Carolina o María necesitan algo nuevo (pedir una función)

Cuéntalo en el chat describiendo:

1. **Qué necesitan hacer** que hoy no se puede, o que es incómodo.
2. **Por qué** lo necesitan — el motivo ayuda a diseñar la mejor solución, no solo la primera idea.
3. Un **ejemplo concreto**, si es posible (ej. "Cuando llega una clienta nueva, necesitamos anotar también su Instagram").

Si el pedido es simple, se implementa directo. Si es más grande o hay varias formas de resolverlo, primero se hacen preguntas para no adivinar mal, y se muestra un plan antes de tocar el código.

## Qué esperar

- No hay un tiempo de respuesta fijo — depende de la complejidad del pedido — pero normalmente los cambios chicos quedan el mismo día.
- Cada mejora aprobada sube el número de versión de la app (se ve abajo del menú lateral) y queda registrada en `CHANGELOG.md`, en la carpeta principal del proyecto en GitHub.
- Si algo se rompe con un cambio, se puede volver a la versión anterior revisando el historial de commits en GitHub — nunca se pierde una versión que ya funcionaba.

## Qué NO hacer sin avisar primero

- No cambiar planes ni configuraciones en el dashboard de Render sin conversarlo primero (algunos cambios afectan a todos los usuarios, o cuestan dinero).
- No compartir la contraseña de la app fuera del equipo (dueño, Carolina, María).
