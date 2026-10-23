# Historial de cambios

Historial de cambios; este archivo no participa en la compilación. Las mejoras locales 1.22–1.27.1 se integran en la publicación 1.27.2, probada y aprobada por el propietario.

## Sin publicar

## 1.27.2 — 2026-10-23

- APK validado en dispositivo por el propietario y publicación autorizada.

- Las 59 coincidencias de herramientas corregidas: auditoría Maven completa de los ámbitos revisados termina en cero (258 versiones); npm también conserva cero alertas conocidas.
- Lint actualizado: 0 errores y 5 advertencias justificadas (orientación, puerto generado RN y comprobación del resultado de commit). 60 pruebas JS y 13 Android aprobadas, más compatibilidad de herramientas.

- AGP/Gradle/Kotlin/D8 actualizados; restricciones corregidas y alineadas de bibliotecas de compilación con pruebas de sus APIs reales.
- Gradle valida su descarga mediante SHA-256 y CI incluye la comprobación de compatibilidad de herramientas.
- Escritura duradera de interacciones de notificaciones en cola fuera del hilo de interfaz, conservando claves y orden de guardado/lectura/borrado. Pruebas de orden, hilo y recuperación de error.
- PNG con extensión corregida, icono temático monocromático y símbolo vectorial de notificaciones separado del logo. Recursos raster heredados y cadenas/colores obsoletos retirados.
- Se conserva el logo adaptativo de Android moderno, la interfaz, datos, firma, ARM64, orientación vertical y comportamiento de la huella. Validación sin emulador.

## 1.27.1 (calidad local)

- AndroidX Biometric estable 1.1.0, Okio 3.4.0 corregido y repositorio JitPack innecesario retirado.
- Inventario de dependencias Maven resueltas para APK, pruebas y herramientas, y auditoría OSV sin ocultar hallazgos.
- Pruebas Android JVM de alarmas, canal y compatibilidad OkHttp/Okio; CI preparada con compilación, lint e informes.
- Recolector local de frames/memoria para teléfonos físicos y microbenchmark sintético del dominio. Medición real pendiente por elección del propietario.
- No se cambia interfaz, datos, firma histórica ni bloqueo al volver del segundo plano. Sin emulador ni publicación.

## 1.27.0 (migración local)

- Cadena de compilación Android sin Expo CLI ni sus módulos.
- Metro 0.87.1, Babel React Native y autolinking explícito de bibliotecas nativas.
- Módulos Android de biometría, portapapeles y recordatorios con contratos JS conservados.
- Conservación de interfaz, dominio, AsyncStorage, paquete y certificado histórico.
- Auditoría npm completa: cero vulnerabilidades, sin exclusiones ni avisos silenciados.
- CI bloquea nuevas vulnerabilidades. Validación física pendiente del propietario; no se ejecuta emulador.

### Dependencias (revisión posterior a 1.26.0)

- PostCSS 8.5.31 y UUID 11.1.1 mediante overrides limitados a sus consumidores.
- Pruebas de compatibilidad con las APIs usadas por Expo Metro y Xcode.
- Auditoría completa: de 15 a 5 alertas altas; pendientes `image-size` y `node-forge` y su propagación.
- No se regeneró el APK ni se migró Expo/React Native en esta revisión.

## 1.26.0 (preparación local)

- Validación estricta de datos guardados, pagos, cuotas, identificadores, fechas y sumas.
- Conservación explícita de historiales antiguos cuyo detalle no incluye IDs.
- Tipado estricto de todo el dominio financiero y separación de migraciones en `src/data`.
- Vista de recordatorios sin dependencia directa del programador de notificaciones.
- Eliminada la ruta inaccesible de Movimientos; sus funciones se conservan en un panel de gastos variables en Plan.
- Retiradas capturas de prueba, icono antiguo y funciones 50-30-20 sin uso.
- Actualizadas 15 dependencias compatibles: auditoría pasa de 23 a 15 alertas, sin críticas. Continúan 6 altas y 9 moderadas.
- Modo de firma de producción estricto preparado y probado sin credenciales; certificado histórico conservado en el APK de actualización. Migración de firma pendiente.
- No se cambia el comportamiento de la huella al regresar del segundo plano.

## 1.25.1 (preparación local)

- Al cambiar de pestaña, su lista vuelve arriba sin animación vertical.
- Se conservan filtros, orden elegido y estado de cada pantalla; no se remontan las pestañas.
- El mismo comportamiento se aplica al navegar con botones o con deslizamiento horizontal.

## 1.25.0 (preparación local)

- Plan continuo, sin secciones por fecha ni agrupación automática.
- Orden opcional y persistente por registro, nombre, valor, fecha o categoría.
- Avisos internos con diálogos propios, temas, botones amplios y contenido desplazable.
- «Recordatorios actualizados» con confirmación visual de éxito.
- Validaciones, errores de guardado y confirmaciones reutilizan el diseño compartido.
- Permisos y biometría del sistema siguen usando la interfaz oficial de Android.

## 1.24.0 (preparación local)

- Distribución con columnas uniformes adaptadas al ancho y tamaño de letra.
- Disponible como segmento verde y porcentaje propio, sin explicación del espacio sin color.
- Ingreso extra configurable: monto, descripción y repetición por sueldo. Los ocasionales se reinician al cerrar, sin trasladar sobrantes.
- Historial conserva el ingreso extra al cerrar el plan.
- Avisos con saldo pendiente, acceso al gasto al tocarlos y recuperación al volver a la app.
- Ajustes para solicitar permiso y actualizar recordatorios sin duplicarlos.

### Limpieza previa

- Selector de categorías compartido entre formularios de gastos y gastos fijos.
- Limpieza de variables sin uso y consolidación de notas de versiones.

## 1.23.0

- Acciones separadas por gastos, pagos, sueldo, periodos y seguridad.
- Formularios y diálogos independientes con propiedades específicas.
- Validación compartida de cuotas, montos y fechas.
- Manejo de fallos del portapapeles y limpieza de su temporizador.
- Tipado estricto gradual del núcleo financiero y workflow de calidad.
- Sin cambios intencionales de diseño ni formato del almacenamiento.
- ARM64, versionCode 28. Pendiente revisión de dependencias documentada en `docs/ARCHITECTURE.md`.

## 1.22.0

- Separación en pantallas, componentes, estado, dominio, servicios y temas.
- Abonos, correcciones y cierre de sueldo independientes de la interfaz.
- Guardado secuencial, migraciones y recuperación desde respaldo local.
- Sincronización centralizada de recordatorios y temas sin estado global mutable.
- Pruebas automatizadas de cálculos, persistencia y referencias de interfaz.

## 1.21.1

- Inicio compacto con disponible y distribución por categorías; porcentajes solo en leyenda.
- Colores compartidos entre formularios, Plan y calendario.
- Menú flotante para registrar gastos y abrir el formulario de gasto fijo.
- Clasificación local por nombre, sin enviar datos a internet.
- Menú de editar/eliminar que no expande el detalle.
- Plan simplificado, saldo pendiente visible tras abonos y recurrencia al cerrar el sueldo.
- Historial colapsado, sueldo en Ajustes, navegación horizontal y Atrás hacia Inicio.
- Acceso mediante huella; se conserva el oscurecimiento de los modales y el gesto original.

## 1.13.0

- Plan por sueldo con cobro el 30 o 31, pago al cobrar, al día siguiente u otra fecha.
- Estados próximo/hoy/vencido/pagado y vencimiento de factura independiente.
- Corrección de pagos con ajuste de cuotas y detalle reorganizado.
- Proyección de disponible, próximos pagos, calendario e historial.
- APK exclusivo ARM64, aproximadamente 29 MB.

## 1.11.0

- Inicio renovado con disponible, resumen y próximos vencimientos.
- Plan compacto con búsqueda y filtros; pendientes ordenados por fecha.
- Gestión de gastos guardados, abonos y edición desde el detalle.
- Sobrantes únicamente en historial al cerrar el ciclo.

## Instalación y publicación

Instalar el APK firmado sobre la versión anterior, sin desinstalar, para conservar los datos. No publicar código ni APK sin autorización del propietario. Las notas describen el estado de cada versión y no implican que todas esas funciones sigan vigentes en la última.
