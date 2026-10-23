# Finanzas Personales

App local para Android ARM64. Organiza pagos por sueldo, permite abonos y correcciones, clasifica gastos, muestra el calendario y conserva el historial de cada plan.

Los datos viven en el dispositivo. Se conserva la clave histórica de AsyncStorage y un respaldo local de la versión válida anterior.

## Desarrollo

Requiere Node.js 22.13+ de la rama 22, 24.3+ de la rama 24 o 26+, y el entorno Android del proyecto.

1. `npm ci`
2. `npm run verify`
3. En PowerShell: `cd android` y `.\\gradlew.bat assembleRelease`.

El APK se genera en `android/app/build/outputs/apk/release/app-release.apk`. La compilación de producción es exclusiva para ARM64.

No ejecutar el emulador: las validaciones visuales las realiza el propietario instalando el APK como actualización. No desinstalar para conservar sus datos.

## Arquitectura y mantenimiento

Consultar [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para responsabilidades, persistencia, migraciones y reglas financieras.
El historial de versiones se concentra en [CHANGELOG.md](CHANGELOG.md); es documentación de publicación, no una dependencia de la app.

- `npm run check`: sintaxis, referencias e importaciones locales.
- `npm run typecheck`: tipos estrictos de todo el dominio financiero; vistas y hooks pendientes.
- `npm run audit:deps`: auditoría actual de dependencias; puede terminar con error mientras existan alertas pendientes.
- `npm run audit:native`: auditoría Maven de APK, pruebas y herramientas, después de generar el inventario con Gradle.
- `npm test`: pruebas automatizadas sin emulador.
- `npm run format`: formatear fuentes.

Arquitectura por capas, con presentación tipo MVVM mediante hooks y adaptadores nativos. El workflow de calidad ejecuta `npm run verify` en GitHub sin publicar versiones. Consultar también la deuda de seguridad de dependencias en la documentación de arquitectura.

La verificación Android/CI y sus límites están en [docs/QUALITY.md](docs/QUALITY.md). La medición local preparada para teléfonos físicos está en [docs/PERFORMANCE.md](docs/PERFORMANCE.md). No se envían métricas a ningún servidor.

El trabajo Android de CI ejecuta `verifyToolingCompatibility`, pruebas JVM, lint, ensamblado e inventario/auditoría Maven. No publica APK ni releases. Las correcciones de seguridad de las herramientas y su cobertura se documentan en [docs/NATIVE-DEPENDENCIES.md](docs/NATIVE-DEPENDENCIES.md).

La versión 1.27.0 elimina Expo CLI y sus módulos. `npm start` usa Metro; no hay comandos `expo prebuild`, exportación web o construcción iOS en este proyecto Android. Los módulos Android propios implementan biometría, portapapeles y recordatorios. El autolinking explícito registra AsyncStorage, Safe Area y SVG; al añadir una biblioteca Android hay que actualizarlo y probar el enlace nativo. Consultar [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md).

Subir cambios o publicar versiones solo cuando el propietario lo autorice.

Consultar [docs/SIGNING.md](docs/SIGNING.md) antes de usar una clave de producción nueva. El APK de actualización conserva el certificado instalado; el modo producción exige credenciales y no tiene fallback silencioso.
