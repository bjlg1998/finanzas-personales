# Flujo

App personal de finanzas para Android. Organiza el dinero por ciclos de pago
del día 31 al día 30, registra en el historial el saldo que sobró y comienza
cada nuevo período con el sueldo configurado. Protege los datos con la biometría
del teléfono.

## Ejecutar

1. Instala Node.js 20 o superior.
2. Ejecuta `npm install`.
3. Ejecuta `npm run android` y abre el proyecto con Expo Go o un emulador.

Los datos se guardan únicamente en el dispositivo usando AsyncStorage.

## Versión 1.11.0

- Inicio con disponible, resumen de pagos y próximos vencimientos.
- Plan con lista compacta, búsqueda y filtros de pendientes, pagados y todos.
- Selección múltiple de gastos guardados para incluirlos en el mes.
- Detalle con abonos, pago completo, edición y opción de quitar del mes.
- El sobrante al cerrar un ciclo se conserva en el historial y no se traslada.
