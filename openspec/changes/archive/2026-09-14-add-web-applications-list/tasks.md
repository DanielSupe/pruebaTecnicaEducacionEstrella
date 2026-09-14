## 1. Formato y traducción de datos

- [x] 1.1 `features/applications/format.ts`: fecha legible en español y monto agrupado
- [x] 1.2 El monto va **sin símbolo de moneda**: no se persiste ninguna. La unidad va en la
      cabecera de la columna
- [x] 1.3 `components/StatusBadge.tsx`: traduce el estado a su texto en español y sus clases,
      tomadas de la tabla de la skill. El distintivo lleva **texto**, no solo color
- [x] 1.4 Un estado que no esté en la lista no debe romper la fila

## 2. Consulta paginada

- [x] 2.1 `features/applications/list.ts` con `useInfiniteQuery`
- [x] 2.2 El puntero se devuelve **tal cual**, sin interpretarlo: es opaco a propósito y el
      servidor reconstruye la partición desde el token
- [x] 2.3 Sin puntero en la respuesta, no hay página siguiente
- [x] 2.4 Clave de consulta propia, para poder invalidarla tras completar una subida

## 3. Ventana emergente con contenido

- [x] 3.1 `components/Modal.tsx` sobre el `<dialog>` del navegador
- [x] 3.2 Justificación de por qué no SweetAlert2 **aquí**: recibe HTML, no componentes, y estas
      ventanas llevan estado vivo. El elemento nativo ya da trampa de foco, escape, `aria-modal`
      y fondo inerte
- [x] 3.3 SweetAlert2 **no se toca**: sigue siendo el único camino para confirmar, error y éxito
- [x] 3.4 Al cerrar, el foco vuelve al elemento que la abrió
- [x] 3.4b No previsto: NO se limpia la referencia al elemento tras devolverle el foco. Hacerlo
      parecía prudente y era justo lo que rompía el comportamiento en desarrollo, donde React
      monta y desmonta cada componente dos veces a propósito
- [x] 3.5 Ampliar `patterns.md` de la skill con la regla que separa los dos casos

## 4. Pantalla del listado

- [x] 4.1 `routes/ApplicationsPage.tsx` con los cuatro estados
- [x] 4.2 Cargando: esqueletos con la forma del contenido, no un indicador centrado
- [x] 4.3 Vacío: dice **qué hacer**, no solo que no hay nada. No es un error
- [x] 4.4 Error: **en línea**, donde iría el contenido, con reintentar. Nunca ventana emergente
- [x] 4.5 Tabla en escritorio, lista de tarjetas por debajo de 768 px. Son cinco columnas:
      forzar desplazamiento horizontal es la salida perezosa
- [x] 4.6 Lo que se duplica es la disposición, **no la lógica**: distintivo y acciones salen de
      componentes compartidos
- [x] 4.7 Botón de cargar más, solo si hay página siguiente
- [x] 4.8 Una acción por fila, la que corresponde al estado
- [x] 4.8b No previsto: la columna de acciones se quedaba sin ancho y el texto del botón se
      partía en dos líneas. Detectado mirando la pantalla, no el diff
- [x] 4.9 **Borrar `routes/HomePage.tsx`** y apuntar la ruta raíz al listado
- [x] 4.10 Comprobar que nada más importaba de ese archivo antes de borrarlo

## 5. Completar una subida pendiente

- [x] 5.1 `features/applications/RetryUploadModal.tsx`
- [x] 5.2 Reutiliza `renovarAutorizacion`, `transferirVideo`, `avisarSubidaCompletada`,
      `esCancelacion` y `UploadError` de `upload.ts`. **No se reescribe nada de eso**
- [x] 5.3 La interfaz NO dice "reanudar": el navegador ya no tiene el archivo tras una recarga.
      Pide elegir el vídeo otra vez
- [x] 5.4 Valida el archivo con el esquema compartido **antes** de transferir
- [x] 5.5 Progreso visible y cancelación que aborta de verdad
- [x] 5.6 Cerrar con transferencia en curso pide confirmación
- [x] 5.7 Un fallo se explica **dentro** de la ventana, con el reintento ahí
- [x] 5.8 Al terminar, invalidar la consulta: la fila cambia de estado sin recargar
- [x] 5.9 Cancelar no abre ninguna ventana de error: es deliberado

## 6. Ver el vídeo

- [x] 6.1 `features/applications/VideoModal.tsx` con un reproductor
- [x] 6.2 El enlace se pide **al abrir** y no se guarda: caduca y es una credencial
- [x] 6.3 Solo se ofrece en solicitudes con el vídeo confirmado
- [x] 6.4 Un fallo al obtenerlo se explica en la misma ventana, sin detalle técnico

## 7. Pruebas

- [x] 7.1 El distintivo traduce cada estado a su texto y sus clases
- [x] 7.2 Un estado desconocido no rompe la fila
- [x] 7.3 Formato de fecha y de monto, incluido un monto de un solo dígito
- [x] 7.4 El puntero se propaga cuando lo hay y corta cuando no
- [x] 7.5 Mutar cada una debe romper alguna prueba; si no, la prueba no prueba
- [x] 7.6 Verificar que Vitest informa de más de cero pruebas

## 8. Verificación en el navegador

Con AWS real y dos cuentas de prueba:

- [x] 8.1 Cuenta sin solicitudes → estado vacío que dice qué hacer, no una tabla vacía
- [x] 8.2 API apagada → error **en línea** con reintentar, no una ventana emergente
- [x] 8.3 Varias solicitudes → de más reciente a más antigua
- [x] 8.4 Con un límite bajo forzado, cargar más trae la siguiente **sin repetir elementos**
- [x] 8.5 **Con la segunda cuenta: no aparece ni una solicitud de la primera**
- [x] 8.6 Solicitud pendiente → la ventana sube el vídeo y la fila cambia **sin recargar**
- [x] 8.7 Cancelar dentro de la ventana → comprobar en el panel de red que la petición **se
      aborta**, no que solo desaparece el progreso
- [x] 8.8 Solicitud enviada → el vídeo **se reproduce**, y **adelantar dentro de él funciona**.
      Vídeo generado en el navegador con MediaRecorder sobre un canvas: real y reproducible, sin
      subir archivos personales del usuario.
      Cierra la tarea 5.1 que quedó pendiente en el change 12
- [x] 8.9 Escape cierra las ventanas y el foco vuelve al botón que las abrió
- [x] 8.10 Cerrar con una subida en curso pide confirmación
- [x] 8.11 **375 px sin desplazamiento horizontal**: la tabla es lista de tarjetas
- [x] 8.12 Recorrido completo con teclado, con el foco visible. Apareció que el logotipo —primer
      punto de tabulación de la pantalla— no tenía anillo de foco; corregido
- [x] 8.13 Limpiar solicitudes, objetos y cuentas de prueba al terminar

## 9. Cierre del change

- [x] 9.1 `pnpm turbo lint typecheck test` en verde
- [x] 9.2 Escáner de secretos limpio
- [x] 9.3 Anotar en las notas del AI-LOG lo que haya aparecido al implementar
- [x] 9.4 Archivar el change y sincronizar la capability `solicitud-credito`
- [x] 9.5 Cerrar con un único commit: `✨ feat(web): listado de solicitudes con estado y fecha`
