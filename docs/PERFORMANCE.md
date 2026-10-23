# Medición de rendimiento (local y sin emulador)

No se añaden servicios remotos, analítica, rastreadores ni permisos al APK. Por petición del propietario, la medición en teléfono queda **preparada, no ejecutada**. No se afirma que la app mantenga 120 FPS ni que controle la tasa variable del panel: Android y el fabricante deciden el modo de pantalla.

## Teléfono físico: procedimiento reproducible

1. Instalar el APK release como actualización, sin desinstalar. Desconectar Metro y evitar el modo desarrollo. Mantener iguales batería, temperatura y configuración de pantalla entre comparaciones.
2. Autorizar depuración USB. Usar `adb devices` para encontrar el serial físico. Configurar `ANDROID_HOME` o `ADB_PATH` si adb no está en PATH.
3. Ejecutar `npm run perf:device -- begin SERIAL`. Solo reinicia estadísticas gráficas, no los datos de la app.
4. Abrir/desbloquear manualmente; recorrer Inicio → Plan → Calendario → Historial → Ajustes, hacer scroll de Plan y abrir/cerrar un detalle y un formulario con teclado. Usar el mismo recorrido durante 30–60 segundos.
5. Ejecutar `npm run perf:device -- collect SERIAL`. Repetir al menos tres veces por dispositivo y versión. Hacer una sesión adicional centrada en el scroll de Plan; el búfer de frames de Android es limitado, no representa necesariamente toda la sesión.

Los resultados quedan en `reports/performance/`, ignorado por Git: muestra de frames, memoria del paquete, campos de refresco que el fabricante exponga y resumen JSON. No se instala, fuerza cierre, desbloquea ni navega por el teléfono automáticamente. No se capturan pantallas, logcat completo ni datos financieros. Los archivos de diagnóstico pueden contener metadatos técnicos del dispositivo: no subirlos sin revisarlos.

El resumen calcula p50/p95 de `FrameCompleted - IntendedVsync` y frames fuera de su `FrameDeadline` cuando Android lo proporciona. No usa un umbral fijo de 16,67 ms: a 120 Hz un intervalo es aproximadamente 8,33 ms, pero el plazo real también depende de la planificación/pipeline. Si no hay muestras/deadlines, devuelve `null`, no una evaluación inventada. Estos tiempos de pipeline no son una medición aislada del trabajo de CPU/GPU.

Revisar `TOTAL PSS` en los archivos de memoria al repetir recorridos: interesa que no crezca continuamente al abrir/cerrar pantallas. Los campos de display son una instantánea, no un historial de refresco variable. Si aparecen tirones, el siguiente paso es una traza Perfetto/Android Studio sobre el teléfono, no forzar 120 Hz permanentemente. Este recolector no mide directamente el hilo JS, batería, inicio en frío ni latencia táctil.

Referencia: [dumpsys oficial de Android](https://developer.android.com/tools/dumpsys).

## Línea base del dominio en computadora

`npm run perf:domain` ejecuta selectores y ordenamiento con 16, 100 y 1000 gastos sintéticos, calentamiento y 100 muestras. Guarda un JSON local para comparar cambios en la misma máquina. **No representa rendimiento de Hermes, memoria Android ni FPS.** No se pone un umbral absoluto de CI porque el hardware compartido introduce variación.

Primera ejecución en esta computadora: p95 aproximado de 0,15 ms (16), 1,87 ms (100), 23,90 ms (1000). Son observaciones locales, no objetivos garantizados. Para el uso habitual de 16 gastos no justifican reescribir listas o navegación antes de medir el teléfono. En volúmenes grandes conviene evaluar fechas precomputadas para ordenar y virtualización de listas, si la traza confirma que son el cuello de botella.
