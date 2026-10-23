# Arquitectura de Finanzas Personales

El refactor conserva la interfaz, el paquete Android, su firma y la clave de AsyncStorage `@flujo/v1`. No requiere reinstalar la app ni cambiar de tecnología.

## Responsabilidades

Desde 1.27.0 la base es React Native Android sin Expo. Los adaptadores del teléfono usan un módulo Kotlin propio basado en AndroidX y APIs del sistema; las pantallas y el dominio permanecen independientes de esas implementaciones. Ver `DEPENDENCIES.md` para la migración, verificaciones y limitaciones.

La app utiliza **arquitectura por capas con presentación tipo MVVM mediante hooks**, y adaptadores para las capacidades nativas. Las pantallas son las vistas; los hooks coordinan su estado y acciones; el dominio contiene reglas puras; los servicios adaptan almacenamiento y hardware. Está inspirada en Clean Architecture y puertos/adaptadores, pero no es una implementación estricta: algunos hooks aún importan adaptadores concretos. No utiliza microservicios ni necesita múltiples módulos Gradle.

El objetivo es separación verificable y cambios seguros, no añadir abstracciones para cumplir etiquetas.

## Higiene del proyecto

Plan usa `orderedPlan`, un selector puro que filtra y ordena sin mutar el registro original. La preferencia `planOrder` se guarda con los datos, por defecto en orden de registro. Las fechas no crean secciones en Plan; el calendario conserva su organización temporal.

Los avisos internos usan `appNotice`, una cola observable independiente de React Native. `AppNoticeHost` la muestra mediante `AppDialog`, el mismo componente usado para confirmaciones. No se modifica globalmente `Alert` ni se reemplazan los permisos o diálogos biométricos de Android. Las acciones se retiran de la cola antes de ejecutarse para evitar dobles pulsaciones; los fallos de guardado conservan su botón de reintento. Una prueba prohíbe nuevas importaciones del `Alert` nativo en las fuentes de la app.

Las notas de publicación se concentran en `CHANGELOG.md`; no son código ni requisitos de compilación. `CategoryPicker` comparte el catálogo, colores y selección accesible en los dos formularios. El chequeo estático detecta importaciones y variables locales sin uso, además de referencias inexistentes.

No borrar archivos únicamente por su antigüedad. Migraciones, compatibilidad con datos históricos, recursos Android por densidad, pruebas y archivos de bloqueo tienen una función. Los APK y cachés locales están ignorados por Git. Los APK existentes no se eliminan durante limpiezas de código.

La antigua ruta inaccesible `moves` se reemplazó por `VariableExpensesList`, reutilizada en un panel de Plan para consultar, editar y eliminar gastos variables. Se retiraron las funciones 50-30-20 sin consumidor; no se presentan como una función activa. Las capturas antiguas y el icono sin referencias se retiraron del árbol de trabajo y siguen recuperables desde Git.

| Capa | Responsabilidad |
| --- | --- |
| `App.js` | Punto de entrada, proveedores y área segura. |
| `src/screens` | Componentes independientes para cada pestaña; reciben datos y acciones explícitos. |
| `src/components` | Campos, modales, iconos, formularios y estructura visual. |
| `src/state` | Carga inicial y coordinación de las acciones del usuario. |
| `src/data` | Valores iniciales y migraciones versionadas, sin dependencias de presentación. |
| `src/domain` | Reglas financieras, fechas, categorías y cálculos puros, sin dependencias de React ni Android. |
| `src/services` | Almacenamiento, recordatorios y biometría. Adaptadores inyectables permiten probarlos sin hardware. |
| `src/theme` | Paletas inmutables y estilos memorizados mediante contexto de React. |
| `src/navigation` | Orden compartido entre pestañas y paginador. |

`useFinanceController` compone hooks especializados: `useExpenseActions`, `useFixedExpenseActions`, `useFixedPaymentActions`, `useSalaryActions`, `usePeriodActions`, `usePaymentLinks` y `useAppSecurity`. Los formularios y diálogos en `components/sheets` reciben únicamente las propiedades que necesitan. El componente `ExpenseSheets` es un ensamblador, no contiene formularios ni reglas financieras.

Los componentes visuales no leen AsyncStorage ni programan notificaciones. Las reglas de dinero están separadas de las pantallas. Los montos se representan en pesos colombianos enteros. `validateFixedExpense` comparte las validaciones de creación y edición, incluidas cuotas y fechas enteras.

`useNotificationSettings` coordina permisos y actualización de avisos; su vista solo presenta estado y acciones. `financeRepository` depende de `data/migrations` y del dominio, nunca del estado de React.

### Alcance de SOLID

- Responsabilidad única: acciones y formularios divididos por función.
- Abierto/cerrado: se pueden añadir componentes y adaptadores sin reescribir las reglas de pago; no todas las extensiones evitan modificar el ensamblador.
- Sustitución: se aplica a los contratos de adaptadores, no a jerarquías de herencia inexistentes.
- Segregación: cada formulario recibe un contrato de propiedades reducido.
- Inversión: dominio independiente y servicios inyectables de persistencia y conciliación. La inversión completa de todos los hooks sigue siendo una mejora futura.

No se certifica cumplimiento absoluto de SOLID ni calidad de producción únicamente por pasar pruebas.

## Reglas que deben conservarse

- Un abono solo modifica el pago acumulado del plan actual.
- El total pagado no puede ser negativo ni superar el valor del gasto.
- Completar un pago avanza como máximo una cuota por plan. Corregirlo revierte únicamente ese avance.
- El cierre guarda una instantánea de pagos realizados y pendientes; el sobrante no se traslada.
- El siguiente sueldo reinicia los pagos y conserva gastos recurrentes e historial de cuotas.
- La distribución cuenta cada gasto una vez. La meta de ahorro es una reserva adicional e independiente de un gasto categorizado como ahorro.

## Guardado y compatibilidad

El ingreso base y el extra son independientes. `totalIncome` es el cálculo común para disponible, distribución e historial. El extra puede ser ocasional (se reinicia al cerrar) o recurrente (repite la configuración); nunca representa traslado del saldo sobrante. Los campos nuevos son opcionales al leer datos históricos y tienen valores por defecto.

`financeRepository` conserva el JSON existente y añade `schemaVersion`. Las migraciones preservan campos desconocidos e historial. La clasificación automática de nombres se ejecuta una sola vez y respeta las correcciones manuales posteriores.

Las escrituras se ejecutan en orden. Antes de reemplazar el registro principal, se guarda la versión válida anterior en `@flujo/v1/backup`. Es un respaldo local, no una copia en la nube.

Los datos corruptos no se reemplazan por un plan vacío. Si existe un respaldo válido, la app informa que lo recuperó; si no, permite reintentar la carga. Una versión de datos futura no se degrada restaurando un respaldo antiguo.

`domain/dataValidation` comprueba abonos finitos y dentro del monto, cuotas enteras, días y fechas reales, identificadores no vacíos y no duplicados dentro de cada colección, y límites de sumas. Los historiales antiguos sin identificador en las filas del detalle siguen admitidos: esas versiones nunca guardaban dicho campo. No se convierten abonos corruptos en cero ni se descartan registros silenciosamente. Los valores opcionales omitidos por versiones anteriores conservan compatibilidad.

Cuando falla una escritura, se informa al usuario y se ofrece reintentar mientras los cambios continúan en memoria. El registro del dinero no depende de que Android permita programar recordatorios.

## Recordatorios y biometría

`usePaymentNotifications` sincroniza las notificaciones con el plan guardado en el estado. El servicio consulta los avisos programados, cancela los obsoletos o duplicados, conserva los que coinciden y crea únicamente los faltantes.

Solo se avisan saldos pendientes, un día antes y el día planeado a las 09:00 locales. La sincronización es secuencial y las claves estables hacen que reintentar no duplique avisos. Los permisos se solicitan por separado del cálculo.

La versión de claves `finance:v2` renueva los textos anteriores una vez; las claves estables posteriores conservan la idempotencia. Al regresar a primer plano se reconcilian los avisos; Ajustes permite solicitar permiso y reintentar. Tocar un aviso abre el detalle del gasto del plan correspondiente, sin registrar un pago automáticamente y sin saltarse la protección biométrica. Avisos de otros ciclos no abren un gasto del plan nuevo. Android puede retrasar la entrega por permisos, canal o batería: no se garantiza puntualidad exacta solo con pruebas unitarias.

La protección biométrica mantiene ocultas las pantallas antes de terminar la autenticación. La comunicación con el hardware está concentrada en un adaptador.

## Comprobaciones

TypeScript comprueba en modo estricto **todo `src/domain`** mediante contratos JSDoc (`tsconfig.json`): fechas, categorías, selección, pagos, ingresos, cierre, recordatorios, orden y validación de datos. Las pantallas y los hooks siguen en JavaScript sin comprobación completa de tipos. No se añaden dependencias al APK para comprobar tipos.

El workflow `.github/workflows/quality.yml` ejecutará las comprobaciones en pushes y pull requests cuando se publique. No publica APK ni modifica el repositorio. Las pruebas de arquitectura impiden que el dominio importe servicios o presentación.

- `npm run verify`: revisión estática y pruebas de dominio, guardado, migraciones, recordatorios y referencias de la interfaz.
- `npm run typecheck`: comprobación estricta de los módulos incluidos en la adopción gradual de TypeScript.
- `npm run format`: formateo de fuentes con las herramientas Babel existentes.
- `android/gradlew.bat assembleRelease`: compilación del APK ARM64.

Las pruebas de interfaz simulan los adaptadores nativos. No comprueban la disposición visual, los gestos, los Hz, los diálogos de permisos ni la huella física. Esas validaciones se hacen en el dispositivo del propietario. No ejecutar el emulador sin su indicación.

Publicar código y APK únicamente después de que el propietario valide y autorice la subida.

## Deuda de calidad pendiente

Estado actual 1.27.0: el árbol completo de npm reporta **cero vulnerabilidades**, tras retirar Expo CLI y sus dependencias e instalar Metro actualizado. Los recuentos siguientes son históricos. Esto no certifica ausencia de fallos en código propio ni en dependencias Android no analizadas por npm.

Actualización de la revisión de dependencias: PostCSS y UUID se corrigieron mediante overrides de alcance limitado y pruebas de compatibilidad. Quedan **5 alertas altas**, sin moderadas ni críticas. Ver `DEPENDENCIES.md` para causas, alcance y límites. El recuento siguiente describe la revisión anterior, no el estado actual.

La nueva auditoría npm del 23 de octubre de 2026 reportó 23 alertas antes de corregir dependencias. `npm audit fix --ignore-scripts`, sin `--force`, actualizó 15 paquetes compatibles y dejó 15 alertas (9 moderadas, 6 altas, ninguna crítica). Se corrigió la alerta crítica de `shell-quote`. El recuento no demuestra por sí solo explotación en el APK; quedan dependencias de herramientas de Expo/Metro que requieren revisar actualizaciones mayores. No se forzaron versiones incompatibles para reducir el contador. No afirmar que la app está libre de vulnerabilidades.

La firma tiene un modo producción explícito que falla sin credenciales y un modo de compatibilidad para actualizar las instalaciones actuales. El APK entregado conserva su certificado histórico: la migración definitiva de clave NO está realizada. Ver `SIGNING.md`.

Pendientes: tipado de hooks y vistas, pruebas de interacción real y accesibilidad, medición de rendimiento y revisión de las dependencias restantes. Por petición del propietario no se cambia el comportamiento biométrico al regresar del segundo plano. El controlador todavía ensambla bastante estado de presentación.
