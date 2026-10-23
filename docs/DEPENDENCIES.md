# Dependencias y alertas de seguridad

## Estado actual: 1.27.2

Auditoría npm completa: **0 vulnerabilidades reportadas**. Auditoría Maven de los classpaths resueltos de release, pruebas y herramientas: **0 coincidencias conocidas en 258 coordenadas/versiones**. Las 59 coincidencias de herramientas de 1.27.1 se corrigieron con actualizaciones reales y comprobaciones de compatibilidad. Ver `NATIVE-DEPENDENCIES.md` para versiones, cobertura y limitaciones. Las cifras siguientes corresponden a revisiones anteriores.

## Revisión nativa posterior (1.27.1)

El resultado cero descrito abajo corresponde **solo a npm**. La auditoría Maven añadida después encontró coincidencias en Okio y en herramientas de compilación. Se sustituyó Okio 2.9 por 3.4.0, se pasó Biometric de alpha a estable y se añadieron pruebas Android. El estado completo, límites y pendientes se documentan en `NATIVE-DEPENDENCIES.md`; no se debe interpretar esta página como cero alertas de toda la cadena Android.

## Migración 1.27.0 (histórico)

La migración retira Expo y sus módulos de npm y Android. Se conservan React Native 0.79.6, React 19, AsyncStorage 2.1.2, la interfaz y las reglas financieras. Metro 0.87.1 y Babel de React Native sustituyen la cadena de Expo.

La auditoría completa tras instalar el nuevo árbol reporta **0 vulnerabilidades**. No se usa `--omit=dev`, filtros de severidad, ignorados ni paquetes renombrados para ocultar alertas. `expo`, `@expo/cli`, `@expo/code-signing-certificates`, `node-forge` e `image-size` ya no están instalados ni en el lockfile. Los overrides de Metro unifican versiones reales de Metro que se ejecutan al compilar; no sustituyen paquetes por stubs.

### Qué se sustituyó

- CLI de Expo: adaptador Android `scripts/native-cli.cjs`, usando la API pública `Metro.runBuild` y sus assets/sourcemaps.
- Autolinking de Expo: manifiesto explícito de los tres paquetes nativos utilizados. Un paquete Android nuevo requiere revisión y registro.
- Biometría: AndroidX BiometricPrompt en `FinanceNativeModule`; no cambia el hook que decide cuándo bloquear. Conserva huella/biometría y clave del dispositivo como alternativa.
- Portapapeles: ClipboardManager de Android, con el mismo contrato del servicio JS.
- Avisos: AlarmManager, NotificationCompat, receptores privados y almacenamiento de programación en SharedPreferences. Avisos de una sola entrega, reconciliados por los mismos selectores JS. Se restauran al iniciar, reiniciar el teléfono o actualizar el paquete. Tocar un aviso abre el gasto y no registra pagos automáticamente.
- Barra de estado: componente de React Native.

Los avisos apuntan a las 09:00 locales. Se usan alarmas inexactas permitidas durante reposo: Android puede retrasarlas por ahorro de batería; no se promete precisión de reloj despertador ni se solicita permiso de alarmas exactas.

Se conserva la identidad Android, el certificado histórico y la clave AsyncStorage. Instalar como actualización, nunca desinstalar. Tras actualizar y abrir esta versión se reconstruyen los recordatorios del plan guardado con el nuevo adaptador.

### Verificación y límites

Las pruebas cubren contratos JS de los adaptadores, saldo pendiente, cancelación, idempotencia, apertura por notificaciones, Babel y árbol de dependencias. La compilación comprueba Kotlin, empaquetado y enlace nativo. No se usa emulador ni se afirma haber probado huella física, entrega real tras reinicio, permisos o gestos en el teléfono del propietario.

`npm audit` solo evalúa las dependencias npm conocidas en el momento de la consulta: cero resultados no significa ausencia absoluta de riesgos, ni audita automáticamente AndroidX, Gradle o todas las rutas nativas.

La instalación y la compilación todavía pueden mostrar avisos de obsolescencia de herramientas heredadas de React Native 0.79 (por ejemplo glob, rimraf o APIs Android). No se cuentan como vulnerabilidades resueltas ni se silencian; son distintos del resultado de la auditoría de seguridad. Revisarlos requerirá actualizar esas herramientas y comprobar compatibilidad, no bajar la severidad del auditor.

CI ejecuta `npm ci`, `npm run verify` y la auditoría completa. Una alerta nueva hace fallar la auditoría; no queda oculta.

## Historial de la revisión anterior (resuelto por retirada de la cadena)

Revisión del 23 de octubre de 2026. Los resultados pertenecen a `npm audit` sobre el árbol completo, incluidas herramientas; no equivalen automáticamente a vulnerabilidades explotables desde el APK.

## Correcciones aplicadas

| Consumidor | Dependencia | Versión corregida | Verificación |
| --- | --- | --- | --- |
| `@expo/metro-config` | `postcss` | 8.5.31 | API CommonJS/default y procesamiento CSS usados por Expo |
| `xcode` | `uuid` | 11.1.1 | Generación de identificadores mediante `v4` |

Los overrides se limitan al consumidor indicado en `package.json`. UUID cambia de versión mayor, pero la API concreta que Xcode consume (`uuid.v4`) se conserva y tiene prueba de regresión. No se ha cambiado Expo, React Native, la biometría ni la firma. Las pruebas no sustituyen la compilación final del APK tras una migración de herramientas.

La auditoría baja de 15 a **5 altas, 0 moderadas y 0 críticas**. No se han ignorado ni silenciado alertas. La auditoría conserva un código de salida no cero mientras persistan.

## Pendientes reales

| Raíz | Por qué permanece | Siguiente evaluación |
| --- | --- | --- |
| `image-size` 1.2.1 | Metro 0.82 llama directamente al export CommonJS como función; la versión corregida 2.0.4 cambia esa API | Migrar Metro/Expo de forma compatible o evaluar un adaptador real y probado; no imponer la versión 2 a ciegas |
| `node-forge` 1.4.0 | No hay versión parcheada publicada para GHSA-86w9-cpqp-85rv | Esperar corrección upstream o sustituir la cadena que lo requiere; actualizar Expo no garantiza eliminarlo |

Las otras tres entradas altas (`expo`, `@expo/cli`, `@expo/code-signing-certificates`) son propagación de `node-forge`, no tres fallos distintos adicionales.

Referencias primarias: [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [image-size JXL/HEIF](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq), [image-size ICNS](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [UUID](https://github.com/advisories/GHSA-w5hq-g745-h8pq).

No usar `npm audit fix --force`: en esta revisión propone retroceder Expo a 44.0.6, lo que rompe la compatibilidad actual y no constituye un plan de migración válido. Tampoco renombrar paquetes ni excluir dependencias del análisis para aparentar cero alertas. Ningún resultado de auditoría garantiza seguridad absoluta ni se mantiene necesariamente igual en el futuro.

## Comandos

- `npm run verify`: tipos, límites arquitectónicos, dominio, persistencia e interfaces de dependencias corregidas.
- `npm run audit:deps`: auditoría completa sin excluir severidades; debe pasar antes de dar por alcanzado el objetivo de cero alertas.

Esta sección histórica describe las dos correcciones iniciales sobre 1.26.0. No representa el estado del árbol migrado 1.27.0.
