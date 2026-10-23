# Revisión de dependencias nativas

## Actualización local 1.27.2

Se evalúa y verifica la siguiente combinación, conservando React Native, paquete y firma:

- AGP 8.13.2 y Gradle 8.14.6 (wrapper con SHA-256 oficial).
- Kotlin Gradle Plugin 2.4.21, versión estable posterior a la corrección de caché.
- D8/R8 9.1.55 de Google Maven. La [tabla oficial de Android](https://developer.android.com/build/kotlin-support) exige al menos 9.1.29 para Kotlin 2.4; no se mantiene el D8 anterior de AGP 8.13.2.
- BOM Netty 4.1.139.Final, alineando todos los módulos dentro de la rama 4.1 utilizada por gRPC.
- Bouncy Castle PKIX/provider/util 1.85 alineados, Commons Compress 1.26.2, Commons Lang 3.18.0, jose4j 0.9.6 y JDOM 2.0.6.1 mediante restricciones del classpath de compilación. Lang se corrige porque la actualización de Compress incorpora una versión transitiva afectada por CVE-2025-48924.

Las restricciones sustituyen bibliotecas reales que AGP todavía solicita en versiones antiguas, no excluyen componentes ni cambian los resultados del auditor. No afectan al classpath del APK salvo las actualizaciones que proceden del propio compilador/Kotlin. [JetBrains documenta](https://kotlinlang.org/docs/gradle-configure-project.html) la compatibilidad de KGP 2.4.21 con estas líneas de Gradle/AGP.

`verifyToolingCompatibility` comprueba las clases resueltas: Netty HTTP, una conexión gRPC en loopback con cierre, firma RSA y certificado PKIX con Bouncy Castle, JWS con jose4j, XML con JDOM y ZIP con Commons Compress. No certifica todas las rutas internas de AGP: se complementa con pruebas Android, lint, DEX, firma y ensamblado release. No usa emulador ni datos financieros.

Auditoría OSV final del 23 de octubre de 2026: **258 coordenadas/versiones únicas y cero coincidencias conocidas**, sin filtros de severidad ni ignorados. Los ámbitos se solapan:

| Ámbito actual | Componentes resueltos | Coincidencias |
| --- | ---: | ---: |
| APK release | 83 | 0 |
| Pruebas JVM | 119 | 0 |
| Herramientas Gradle | 147 | 0 |

Npm también conserva cero vulnerabilidades reportadas en el árbol completo. Esto no amplía la cobertura del auditor a Gradle/JDK/NDK o a todos los plugins internos: los límites descritos al final siguen vigentes. El detalle de pruebas/compilación está en `QUALITY.md`; las cifras de 1.27.1 que siguen son históricas.

Fecha de revisión: 23 de octubre de 2026. Esto amplía la auditoría npm, no la reemplaza.

## Cambios acotados

- Biometric pasa de `1.2.0-alpha04` a `1.1.0`, la versión estable recomendada para la API Java usada por el módulo. No se cambia el flujo de huella/PIN ni se añade bloqueo al regresar del segundo plano. Referencia: [AndroidX Biometric](https://developer.android.com/jetpack/androidx/releases/biometric).
- Okio `2.9.0`, transitivo de OkHttp/React Native, se sustituye realmente por `3.4.0` para corregir [CVE-2023-3635](https://osv.dev/vulnerability/GHSA-w33c-445m-f8w7). Las pruebas ejercitan OkHttp → Okio real y gzip; compilación release y DEX comprueban el empaquetado, no el comportamiento de red de un teléfono.
- La biblioteca de pruebas Robolectric incorpora Bouncy Castle. Se declara el proveedor corregido `1.85` solo en `testImplementation`; no se añade a la app ni modifica el classpath de Gradle.
- Se retira JitPack del repositorio raíz: los módulos resueltos usados no lo requieren. Se conservan Google Maven, Maven Central y el repositorio local de React Native.

## Inventario y auditoría reproducibles

En `android/`, ejecutar `gradlew.bat :app:writeNativeDependencyInventory` (Linux: `bash gradlew`). Luego, desde la raíz, `npm run audit:native`.

Gradle exporta los componentes **resueltos**, no solo las declaraciones, en tres ámbitos:

- `release`: dependencias Maven empaquetables del APK.
- `tests`: dependencias Maven de las pruebas JVM de release, incluidas sus transitivas.
- `tooling`: classpath resuelto del buildscript raíz (AGP/Kotlin y transitivas).

El auditor agrupa coordenadas/versiones, conserva los ámbitos y consulta la [API OSV](https://google.github.io/osv.dev/post-v1-querybatch/), incluidas páginas adicionales. No filtra por severidad, no ignora IDs y falla ante datos incompletos, red caída o coincidencias conocidas. El informe local `reports/native-audit.json` enumera componentes y hallazgos. Antes de cada consulta se marca incompleto para no confundir un éxito anterior con una ejecución fallida.

Solo se envían coordenadas/versiones públicas; nunca código, credenciales o datos financieros. El resultado depende de la cobertura de OSV y del día de consulta. Un paquete sin coincidencias no queda certificado como seguro.

## Deuda de herramientas encontrada en 1.27.1 (histórico)

Resultado final de esta revisión: **257 coordenadas/versiones únicas**, distribuidas en ámbitos que se solapan:

| Ámbito | Componentes resueltos | Coincidencias paquete/aviso |
| --- | ---: | ---: |
| APK release | 83 | 0 |
| Pruebas JVM | 119 | 0 |
| Herramientas Gradle | 143 | 59 |

La auditoría completa termina con código de salida 1 por esas 59 coincidencias de herramientas; no es un resultado limpio global. npm, revisado por separado, conserva cero vulnerabilidades reportadas. Las coincidencias se detectan por versión y no prueban alcanzabilidad/explotabilidad en este proyecto.

La primera consulta encontró **60 coincidencias paquete/aviso**: una de Okio en el APK y 59 en herramientas (14 coordenadas/versiones afectadas). Algunas afectan varios módulos de Netty/Bouncy Castle: no son 60 fallos independientes de la app. Al incluir las nuevas pruebas se detectaron además cuatro coincidencias del proveedor Bouncy Castle transitivo; se seleccionó una versión corregida antes de cerrar la revisión.

Las herramientas afectadas incluyen Protobuf, Commons IO/Compress, Netty, jose4j, Bouncy Castle, JDOM y Kotlin Gradle Plugin. Aunque no se empaquetan en el APK, no deben ignorarse: pueden importar al procesar archivos, repositorios o cachés no confiables durante la compilación.

**En 1.27.1 la deuda no estaba corregida.** Requería una actualización coordinada y comprobación de sus consumidores; se abordó en 1.27.2 con la combinación y pruebas descritas arriba. Forzar arbitrariamente versiones de Netty, criptografía o Kotlin dentro del plugin no demuestra compatibilidad. Por ejemplo, [el aviso de Kotlin](https://github.com/advisories/GHSA-r937-wjx7-w2jp) exigió evaluar otra línea. El trabajo Android de CI bloquea hallazgos de seguridad; no se ocultan con `continue-on-error`.

Este inventario no cubre el binario de Gradle/JDK/NDK, todas las dependencias internas de plugins incluidos como proyectos, vulnerabilidades de código C/C++ incorporado, ni prueba alcanzabilidad de cada aviso. Lint y pruebas no reemplazan esas revisiones. Ver `QUALITY.md` y `PERFORMANCE.md` para verificación y medición.
