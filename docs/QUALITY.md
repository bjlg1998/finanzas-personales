# Verificación de calidad

## Cambios locales 1.27.2

Resultado de pruebas locales: **60 JavaScript y 13 Android JVM aprobadas**, además de la comprobación real de compatibilidad de herramientas. Auditorías npm/Maven: cero alertas conocidas en los ámbitos revisados. El workflow de CI está preparado; su resultado remoto se verifica independientemente de estas pruebas locales.

Compilación release final correcta con Gradle 8.14.6. APK 1.27.2 (código 35), paquete `com.personal.flujofinanzas`, solo `arm64-v8a`, 21,24 MiB. Se verificó la firma con apksigner y coincide con el certificado del APK anterior para permitir actualización sin desinstalar. El propietario confirmó que lo probó y que todo funciona, y autorizó subir código y versión. No se ha usado emulador. Los resultados de CI deben consultarse en GitHub, no inferirse de la validación local.

Lint release termina con **0 errores y 5 advertencias**, sin baseline ni supresiones:

| Aviso | Cantidad | Decisión |
| --- | ---: | --- |
| Orientación fija / API desaconsejada | 2 | Mantener el modo vertical acordado; una adaptación a orientación libre sería otro cambio de interfaz. |
| `react_native_dev_server_port` sin consumidor visible para lint | 2 | Recurso generado por el plugin RN y leído por `AndroidInfoHelpers.kt`; no editar generados ni romper desarrollo. |
| Preferir Core KTX `SharedPreferences.edit` | 1 | La extensión devuelve Unit y pierde el resultado de commit. El helper compartido devuelve Boolean, comprobado con una prueba de fallo. |

Las 34 advertencias iniciales corresponden a lint anterior y las 5 actuales al lint actualizado; no se ocultan reglas para reducir el contador. La compilación también puede emitir avisos de deprecación de bibliotecas externas, de compatibilidad de firma y del SDK local duplicado `build-tools;35.0.0-2`. No son vulnerabilidades Maven ni errores de lint del proyecto. No se modifica globalmente ese SDK ni se desactivan avisos.

La cadena actualizada incluye `verifyToolingCompatibility` en la verificación Android/CI. Ejercita las dependencias reales del buildscript, incluidas las versiones efectivamente cargadas de D8, Netty, Bouncy Castle y Commons Lang. Las pruebas de humo no son una prueba exhaustiva de todos los consumidores de AGP; se complementan con pruebas JVM, lint y ensamblado completo.

Las interacciones de notificaciones conservan su nombre de almacenamiento anterior, pero el guardado, lectura y borrado quedan serializados en un único hilo de IO. El evento se emite después de confirmar el guardado y los errores no se convierten en éxito. `commitTransaction` comparte la escritura conservando el booleano de `commit`: Core KTX `edit(commit=true)` devuelve Unit y no permite comprobar ese fallo. Hay pruebas tanto sobre almacenamiento Android simulado como sobre el resultado de un fallo de commit.

Se corrigieron extensiones PNG y recursos de iconos; el adaptativo en color de teléfonos modernos conserva su imagen. El icono temático y el de notificaciones son vectoriales y monocromáticos. Los recursos raster heredados sustituidos siguen recuperables desde Git. La orientación vertical se mantiene por decisión de producto, no se desactiva lint para ocultarla.

Las cifras de 1.27.1 descritas abajo corresponden a la revisión anterior, no al resultado final de esta actualización.

## Comandos

- `npm run verify`: chequeo estático, dominio tipado y pruebas JS de reglas, almacenamiento y enlaces de UI.
- En `android/`: `gradlew.bat :app:testReleaseUnitTest :app:lintRelease :app:writeNativeDependencyInventory :app:assembleRelease --console=plain` (en Linux `bash gradlew`). No requiere emulador. Node compatible, JDK 17, SDK 35 y NDK 27.1 deben estar instalados.
- `npm run audit:deps`: vulnerabilidades npm, incluido desarrollo.
- `npm run audit:native`: consultar OSV con el inventario Maven generado por Gradle. Requiere internet; solo envía nombres/versiones de bibliotecas públicas. Devuelve error ante hallazgos o auditoría incompleta. Ver `NATIVE-DEPENDENCIES.md`.
- `npm run perf:domain` y `npm run perf:device`: ver `PERFORMANCE.md`.

## Qué cubren las nuevas pruebas Android

Verificación local 1.27.1: **60 pruebas JavaScript y 9 pruebas Android JVM aprobadas**, chequeo de 63 archivos fuente, tipos del dominio y compilación release correctos. La auditoría nativa no pasa por deuda de herramientas documentada; no se confunde con el resultado de las pruebas.

Robolectric ejecuta en la JVM APIs simuladas de Android, sin arrancar el `MainApplication` real ni acceder a datos del propietario. Comprueba reemplazo por identificador (no duplicar), cancelación, consumo único, restauración idempotente, conservación de avisos vencidos al arrancar por una alarma, rechazo de programación pasada y canal de notificaciones. Las pruebas de OkHttp/Okio ejecutan las bibliotecas reales para cuerpo de petición y compresión gzip, sin red.

No prueban sensor biométrico físico, permisos concedidos por el fabricante, entrega en reposo real, renderizado del dispositivo ni conservación de datos tras instalación. Esas validaciones siguen siendo del propietario.

## CI automatizada

`quality.yml` conserva la verificación npm y agrega un trabajo Android: pruebas JVM, lint, compilación release e inventario/auditoría nativa. Los informes se conservan 7 días incluso si falla la auditoría. No publica un release ni sube el APK. Se genera un certificado desechable solo en ese runner: no es la firma local ni permite actualizar los teléfonos del propietario.

La auditoría nativa bloquea el trabajo mientras haya coincidencias pendientes, incluidas las de herramientas; no se marca como `continue-on-error`. El inventario y los informes distinguen código empaquetado de herramientas de compilación/pruebas.

## Lint: advertencias distintas de vulnerabilidades

La primera ejecución completa terminó con **0 errores y 34 advertencias**, sin baseline ni supresiones nuevas. Incluyen recursos heredados, formato/forma del icono, orientación vertical fijada y escritura síncrona de la interacción de una notificación. No se modifica la interfaz/rotación o la durabilidad del registro solo para eliminar avisos. Se deben evaluar por separado; cero npm no significa cero advertencias Android.
