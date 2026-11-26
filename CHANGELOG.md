# Historial de versiones

Cada mejora aprobada de la app queda registrada acá como una versión nueva, siempre más alta que la anterior. Si algo falla, se puede volver a cualquier versión anterior con `git checkout vX.Y.Z`.

## Cómo se versiona

- El número de versión (ej. `v1.2.0`) se ve abajo del menú lateral de la app, para saber cuál está en línea.
- Cada mejora nueva sube el número del medio (ej. `v1.1.0` → `v1.2.0`). Un arreglo chico sube el número final (ej. `v1.2.0` → `v1.2.1`).
- Cada versión queda en su propio commit de git (con el número de versión en el mensaje), así que nunca se pierde una versión anterior y se puede volver a cualquiera revisando el historial en GitHub.

## v1.31.0 — 2026-11-26

- **Nuevas columnas "Boleta 1" y "Boleta 2" en Ventas**: al final del listado de Ventas y Clientas hay dos columnas con un check para anotar si ya se le envió a la clienta la primera y la segunda boleta.
  - El check se marca o desmarca **directo desde el listado**, con un click, y queda guardado al tiro (no abre la ficha de la venta).
  - También aparecen en la ficha de cada venta ("Boleta 1 enviada" y "Boleta 2 enviada").
  - Se pueden filtrar (Sí / No), ordenar, ocultar y mover como cualquier otra columna, y salen en el Excel como "Sí" o "No".
  - Todas las ventas que ya existían parten sin marcar.

## v1.30.1 — 2026-11-26

- **La agenda ahora revisa todos los calendarios de Carolina y María, no solo el principal**: antes solo miraba el calendario principal de cada una. Si una cita estaba en otro calendario (por ejemplo, uno de asesorías o uno compartido del taller), la página ofrecía esa hora como libre. Ahora cuentan como ocupados todos los calendarios que cada una tiene visibles en su Google Calendar. Los feriados y cumpleaños no cuentan.
- **Elegir qué calendarios bloquean la agenda**: en Configuración → Conexión con Google, bajo cada una, la opción "Calendarios que bloquean la agenda" muestra sus calendarios para marcar o desmarcar cuáles cuentan. El principal siempre cuenta.
- **Para activarlo**: Carolina y María deben apretar **"Volver a conectar"** una vez más. Google pedirá un permiso nuevo, solo para ver qué calendarios tienen; no ve su contenido. Mientras no lo hagan, la app sigue revisando solo su calendario principal y lo avisa en Configuración.

## v1.30.0 — 2026-11-26

- **Nuevo calendario en la página de agendamiento**: en vez de una fila de días, ahora se ve un **calendario del mes completo**, como el de las clínicas.
  - Los **días con horas disponibles** se destacan en rosa y se pueden elegir.
  - Los **días sin horas** (pasados, fines de semana, ocupados en el calendario de Carolina y María, o fuera de lo que permite la regla del segmento) aparecen **en gris y tachados**, y no se pueden apretar.
  - Al entrar se elige solo el primer día disponible, y al elegir un día aparecen **de inmediato** sus horas libres. En el computador se ven al lado derecho del calendario; en el celular, justo debajo.
  - Con las flechas se cambia de mes, hasta donde llega la agenda.
  - El botón ahora dice la hora elegida: "Continuar con las 11:00 hrs".

## v1.29.2 — 2026-11-26

- **Corrección de la regla de madrinas e invitadas**: los 7 y 5 meses son la anticipación **máxima**, no la mínima. Una madrina solo puede agendar si su evento es **dentro de los próximos 7 meses**, y una invitada, **dentro de los próximos 5 meses**. Así no le quitan a una novia un cupo de un mes más lejano. No hay plazo mínimo: pueden agendar para fechas cercanas si el mes tiene cupo.
- Si una madrina o una invitada intenta agendar para una fecha más lejana, la página le indica desde qué día puede agendar.
- **Todas** (novias, madrinas e invitadas) siguen sin poder agendar si el mes de su evento ya tiene las 8 entregas completas.
- En Configuración → Agenda, la tabla de los próximos 12 meses ahora muestra para cada mes: "Novias, madrinas e invitadas", "Novias y madrinas", "Solo novias" o "Lleno". Ya no se usa el ajuste "meses reservados para novias".

## v1.29.1 — 2026-11-26

- **Las novias también respetan el tope de entregas del mes**: una novia puede agendar para cualquier fecha, salvo que el mes de su evento ya tenga completa la capacidad de entrega (8 vestidos). En ese caso, la página le dice que ese mes está completo y la invita a escribir por WhatsApp para ver alternativas.
- Madrinas e invitadas siguen igual que en la versión 1.29.0.

## v1.29.0 — 2026-11-26

- **La agenda ahora cuida la capacidad de entrega del taller (8 vestidos al mes) y prioriza a las novias**. Las entregas de cada mes se cuentan según la fecha de evento de las ventas registradas en la app.
  - **Novias:** ninguna restricción. Pueden agendar para cualquier fecha, aunque el mes esté lleno, y siguen viendo el botón de WhatsApp para sobrecupos.
  - **Meses reservados para novias:** todo evento a 8 meses o más queda reservado para novias, porque ellas agendan con mucha anticipación. Madrinas e invitadas no pueden tomar esos cupos.
  - **Invitadas:** solo pueden agendar si su evento es en al menos 5 meses (lo que toma confeccionar) y en menos de 8, y si ese mes tiene menos de 8 entregas. Así ocupan los cupos que las novias ya no van a tomar.
  - **Madrinas:** igual, pero con al menos 7 meses de confección.
  - Si no se puede, la clienta ve un mensaje amable: que su fecha está muy cerca para confeccionar, que ese mes ya está completo, o desde qué día puede volver a agendar.
- **Configuración → Agenda:** se puede cambiar la capacidad mensual (8), a cuántos meses se reservan los cupos para novias (8) y cuántos meses toma confeccionar para madrinas (7) e invitadas (5). Además hay una **tabla de los próximos 12 meses** con las entregas registradas de cada mes y para quién quedan libres los cupos.
- Esto reemplaza la regla de la versión anterior (madrinas solo con 7 meses o más de anticipación e invitadas con 5), que no consideraba la capacidad de entrega.

## v1.28.0 — 2026-11-25

- **Nueva página para que las clientas agenden su asesoría**: es un link para la bio de Instagram, `https://hatton-schultz-novias.onrender.com/agendar`. La clienta elige si es **novia, madrina o invitada**, pone la fecha de su evento, elige un día y una hora libres, y deja su nombre, correo y teléfono. Queda agendada al tiro y le llega la invitación de Google Calendar a su correo, con la dirección del taller.
- **Los horarios salen del calendario de Carolina y María**: solo aparecen horas en que al menos una está libre, de lunes a viernes de 10:00 a 18:00 (citas de 1 hora). La cita se anota sola en el Google Calendar de la que quedó asignada; si las dos están libres, se asigna a la que tiene menos citas ese día. Si se cancela o mueve una cita en el calendario, la página lo considera de inmediato.
- **Segmentación por capacidad**:
  - Novias: pueden agendar sin importar la fecha de su matrimonio, y ven un botón de **WhatsApp** para pedir un sobrecupo si no encuentran una hora cercana.
  - Madrinas: solo pueden agendar si faltan **7 meses o más** para su evento.
  - Invitadas: solo pueden agendar si faltan **5 meses o más** para su evento.
  - Si no cumplen la regla, la página se lo explica con un mensaje amable y no muestra horas.
- **Nueva sección "Agenda" en Configuración**: el link para copiar, los meses mínimos de madrinas e invitadas, días y horario de atención, cuántos días hacia adelante se muestran (90), el aviso mínimo (24 horas), el número de WhatsApp para sobrecupos, y un interruptor para **pausar** cada segmento cuando no haya capacidad.
- **Asesorías**: las citas agendadas desde la web aparecen solas en el listado, con su hora, el segmento, la fecha del evento, la diseñadora asignada y el origen "Web" (con monto $0, que se edita si se cobra). También se pueden anotar estos datos a mano en las asesorías manuales.
- **Para activarlo**: Carolina y María deben apretar **"Volver a conectar"** en Configuración → Conexión con Google, para dar permiso al calendario. La app solo ve qué horas están ocupadas (no el contenido de sus eventos) y crea las citas.

## v1.27.0 — 2026-11-17

- **Cada ítem de la cotización va separado, con su precio**: en el PDF, cada ítem aparece como un bloque propio dentro del recuadro de la cotización. Arriba va su **título** en la etiqueta rosada ("Vestido a medida", "Cola", "Velo", "Estola"…), debajo su **descripción** y, a la derecha, **su precio** en negrita. Al final va el **Total cotización** con la suma de todo, para que la novia vea cuánto cuesta cada cosa y el total.
- **Nuevo campo "Título" en cada ítem**: al armar la cotización, cada ítem tiene un espacio para el título (con sugerencias como Vestido a medida, Cola, Velo, Estola) y un cuadro más grande para la descripción, de varias líneas.
- Si la cotización tiene muchos ítems y no caben en la página, el recuadro continúa en una página nueva, con la franja y el logo arriba. Un ítem nunca queda cortado entre dos páginas, y el total final nunca queda solo en una página.
- Las cotizaciones de un solo ítem se ven exactamente igual que la plantilla del taller, como antes.

## v1.26.0 — 2026-11-17

- **Asunto del correo**: las cotizaciones ahora llegan con el asunto "Cotización Hatton Schultz Atelier".
- **El PDF lleva el nombre de la clienta**: el archivo adjunto en el correo, y el que se descarga con "Ver PDF", se llama como la clienta (por ejemplo "María José Schultz.pdf"), con tildes y ñ incluidas. Si el nombre tiene caracteres que no se pueden usar en un archivo (como / o :), se quitan solos.
- **Total en negrita**: en el PDF, el monto total de la cotización ahora sale en negrita completo ("Total: $1.100.000"), no solo la palabra "Total".

## v1.25.0 — 2026-11-16

- **Las cotizaciones ahora salen directo desde el Gmail de María o Carolina**: en vez de pasar por un servicio externo (SendGrid o Brevo), cada cotización se envía desde la casilla real de quien la envía y queda guardada en su carpeta "Enviados". La otra sigue en copia y el PDF va adjunto, igual que antes. Es gratis, porque viene incluido en el Google Workspace del taller.
- **Nueva sección "Correo de cotizaciones" en Configuración**: ahí María y Carolina conectan su casilla una sola vez con el botón "Conectar con Gmail". Google les pide entrar con su cuenta y aceptar un permiso que solo deja **enviar** correos: la app no puede leer su correo. La conexión se puede quitar en cualquier momento con "Desconectar".
- Si alguien se conecta por error con otra cuenta (por ejemplo, un Gmail personal), la app lo rechaza y avisa con qué cuenta hay que entrar.
- Si quien envía todavía no conectó su casilla, la app lo avisa claramente al intentar enviar.

## v1.24.0 — 2026-11-12

- **Envío de cotizaciones por correo con Brevo (gratis)**: el envío había dejado de funcionar con el mensaje "Maximum credits exceeded", porque se acabó la prueba gratis de SendGrid, el servicio que mandaba los correos. Ahora la app envía con **Brevo**, que es gratis hasta 300 correos al día. Los correos siguen saliendo igual: desde la cuenta de quien envía (María o Carolina), con la otra en copia y el PDF adjunto. Las respuestas de la clienta llegan a quien envió.
- Para que funcione hay que crear la cuenta de Brevo, verificar los correos de María y Carolina, y agregar la clave de Brevo (`BREVO_API_KEY`) en Render. Mientras eso no esté listo, la app sigue intentando con SendGrid.
- Los errores de envío ahora se explican en español: por ejemplo, si falta verificar un correo en Brevo, si la clave está mal copiada o si se alcanzó el límite diario.

## v1.23.0 — 2026-11-11

- **Cotización en PDF igual a la plantilla del taller**: el PDF que sale con "Ver PDF" y el que se adjunta en el correo ahora calzan con la plantilla original ("PLANTILLA cotización.pdf"). Se superpusieron página por página, como papel calco, y se corrigieron todas las diferencias:
  - Hoja tamaño carta (antes era A4).
  - Las mismas letras de la plantilla (Assistant), con el mismo espaciado entre letras.
  - El logo real de Hatton Schultz en la portada, la contraportada y la franja de arriba, del mismo tamaño que en la plantilla.
  - Los títulos caligráficos "Datos Clienta", "Cotización" y "Pago", iguales a los de la plantilla.
  - Datos de la clienta en tres recuadros separados (Nombre, Fecha matrimonio y Tipo clienta). Ya no aparecen el correo, el teléfono ni la fecha de validez.
  - Volvió a verse el recuadro rosado de "Vestido a medida", y "Total: $" queda siempre en el mismo lugar que en la plantilla.
  - En "Devoluciones" ahora se indica el monto de la reserva de cupo ($250.000).
  - Los colores, las posiciones y los tamaños de todo coinciden con la plantilla.

## v1.22.0 — 2026-10-13

- **Asesorías**: nuevo módulo para registrar el cobro de una asesoría/consulta con una clienta (fecha, nombre, correo, teléfono opcional, monto, notas), haya terminado o no en una venta. Desde la asesoría se puede crear una cotización para esa misma clienta con sus datos ya cargados. El ingreso se suma al Estado de Resultados y al Flujo de Caja del Dashboard en una columna propia ("Ingresos asesorías"/"Asesorías"), sin afectar el costo de materiales ni la rentabilidad por vestido.
- **Ventas**: ahora se puede ordenar también por Código, Clienta, Tipo, Total, Saldo, % Cobrado, Estado y Producción haciendo clic en el encabezado — antes solo se podía ordenar por las columnas de fecha.
- Confirmado con el equipo: el campo "Precio total negociado" en Editar Venta ya se podía modificar libremente — no se necesitaba ningún cambio ahí.

## v1.21.1 — 2026-10-07

- Corrige el tooltip de "Alcanza sueldo socias" agregado en v1.21.0, que no se mostraba al pasar el mouse — Chrome no muestra tooltips nativos para el atributo `title` puesto directamente en un ícono SVG, así que ahora se coloca en el elemento que lo envuelve.

## v1.21.0 — 2026-10-07

- **Flujo de Caja**: el ícono de "Alcanza sueldo socias" (✓/✗) ahora muestra una explicación al pasar el mouse por encima, con el resultado del mes, la meta de sueldo de socias y cuánto falta (o sobra) para alcanzarla.

## v1.20.0 — 2026-10-07

- **Flujo de Caja: corregidas fechas corruptas (año 1999)**. Se encontró la causa raíz: una celda de fecha ambigua en una importación histórica (ej. "dic-99") se interpretaba literalmente como el año 1999 en vez de 2026, lo que estiraba la tabla con casi 30 años de filas vacías. Ahora esas fechas se excluyen del cálculo y se muestra un aviso indicando exactamente qué venta/cuota revisar y corregir a mano. También se corrigió la función de importación para que una fecha así de ambigua ya no pueda volver a colarse en el futuro.

## v1.19.0 — 2026-10-07

- **Dashboard**: nueva tarjeta "Vestidos vendidos (mes)" junto a "Ventas del mes", que respeta el mismo selector de mes de referencia. "Vestidos en producción" sigue mostrando el total actual, sin filtrar por mes.
- **Flujo de Caja**: se corrige un error estructural en "Saldo pendiente esperado" — antes se asumía que todo el saldo de una venta se cobraba recién en el mes del evento (la boda), lo que estiraba la tabla con muchos meses vacíos hasta fechas de eventos lejanas. Ahora se usa la fecha programada real de cada cuota pendiente, reflejando el plan de pago efectivo de cada clienta.

## v1.18.0 — 2026-10-07

- **Dashboard**: las tarjetas "Ventas del mes" y "Margen bruto % del mes" ya no quedan pegadas al mes calendario actual (que mostraba $0 si todavía no había ventas ese mes) — ahora hay un selector "Mes de referencia" que por defecto muestra el último mes con ventas reales, y se puede cambiar a cualquier otro mes para ver sus resultados.

## v1.17.0 — 2026-10-07

- **N° de documento**: en Registro de Insumos y Gastos Generales ahora se puede anotar el número de la boleta o factura como dato de texto, junto al comprobante adjunto. Se puede ver, filtrar y exportar como columna nueva en ambos listados.

## v1.16.0 — 2026-10-07

- **Comprobantes de gasto**: en Registro de Insumos y Gastos Generales ahora se puede adjuntar la boleta o factura (imagen o PDF, hasta 8 MB) al crear o editar un registro. En el listado aparece una columna "Comprobante" con un link "Ver archivo" cuando hay uno adjunto; en el formulario se puede reemplazar o quitar en cualquier momento.

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
