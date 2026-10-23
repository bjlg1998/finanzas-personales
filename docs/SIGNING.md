# Firma Android y actualización sin pérdida de datos

Las instalaciones existentes usan el certificado histórico de depuración. Cambiarlo directamente por otro certificado puede impedir la actualización sobre la app instalada. No se debe desinstalar para resolverlo: se perderían los datos locales.

## Modos de compilación

- `assembleRelease` mantiene el modo `compatibility` por defecto, con una advertencia explícita. Sirve para actualizar las instalaciones existentes. **No corrige el riesgo del certificado histórico**.
- `assembleRelease -PfinanceSigningMode=production` exige una clave de producción. Si falta cualquier dato, la compilación falla; no vuelve silenciosamente a la clave de depuración.

El modo producción toma estos valores del entorno, nunca de archivos versionados:

- `FINANCE_KEYSTORE_PATH`: ruta del keystore privado, preferentemente fuera del repositorio.
- `FINANCE_KEYSTORE_PASSWORD`
- `FINANCE_KEY_ALIAS`
- `FINANCE_KEY_PASSWORD`

No imprimir contraseñas, incluirlas en comandos compartidos ni guardar el keystore en Git. Conservar copias privadas recuperables de la clave.

## Pendiente antes de activar una clave nueva

1. Preparar exportación y restauración de los datos para contar con una recuperación independiente del respaldo interno.
2. Generar y custodiar una clave privada de producción con autorización del propietario.
3. Diseñar y probar la transición de certificados en las versiones Android admitidas, sin asumir que una firma nueva permite actualizar las instalaciones existentes.
4. Validar identidad del paquete, versión, certificado y conservación de datos en los dos dispositivos del propietario.

En esta mejora solo se prepara y valida la configuración estricta. No se genera una clave nueva ni se cambia el certificado del APK entregado. La activación definitiva de la firma de producción queda pendiente de esa migración.
