## 1. El aviso por encima de la ventana

- [x] 1.1 En `lib/dialogs.ts`, resolver el destino: si hay una ventana modal abierta, se usa como
      contenedor del aviso
- [x] 1.2 Aplicarlo a las tres funciones: confirmar, avisar de error y avisar de éxito
- [x] 1.3 **Automático, sin parámetro.** Si cada pantalla tuviera que indicarlo, olvidarlo
      reproduciría este mismo fallo sin dar ningún síntoma
- [x] 1.4 Dejar escrito en el código **por qué no era un problema de `z-index`**: el elemento vive
      en el top layer del navegador, y ahí no llega ningún `z-index`. Sin esa nota, el siguiente
      que lo lea intentará subir el número
- [x] 1.5 Ninguna pantalla cambia

## 2. La lista de instituciones

- [x] 2.1 `scripts/fetch-institutions.ts`: descarga, deduplica, ordena y escribe
- [x] 2.2 **Deduplicar por nombre**: el registro trae una fila por sede, 361 filas para 300 nombres
- [x] 2.3 Dejar los nombres **en mayúsculas**, como en el registro. Pasarlos a formato título
      rompería siglas como SENA, CESA o CEA
- [x] 2.4 El archivo resultante se versiona: lo que se despliega es lo que alguien revisó
- [x] 2.5 Vive en `apps/web`, **no en `shared`**: solo lo necesita el navegador, y llevarlo a
      `shared` lo metería también en el paquete de la API sin que nadie lo use
- [x] 2.6 Comprobar que las tildes sobreviven a la descarga y al guardado

## 3. El componente

- [x] 3.1 `components/Combobox.tsx`, siguiendo la forma de `Field.tsx` para que el formulario no
      tenga dos estilos de campo
- [x] 3.2 La función de filtrado se extrae **aparte y pura**, para poder probarla sin montar React
- [x] 3.3 Filtrado sin distinguir mayúsculas ni tildes
- [x] 3.4 `role="combobox"` con `aria-expanded`, `aria-controls` y `aria-activedescendant`; lista
      con `role="listbox"` y opciones con `role="option"`
- [x] 3.5 Teclado: flechas para recorrer, confirmar, cerrar sin elegir conservando lo escrito, y
      salir con tabulador
- [x] 3.6 El número de resultados se anuncia a quien no los ve
- [x] 3.7 Al cerrar, el foco vuelve al campo
- [x] 3.8 Clic fuera cierra
- [x] 3.9 Limitar las opciones que se pintan y decir cuántas hay: 300 nodos por pulsación es gasto
      para nada
- [x] 3.10 Sin coincidencias se dice que no hay, **no se ofrece el listado entero**
- [x] 3.11 Mismo comportamiento de error que el resto de campos: mensaje debajo, `aria-invalid` y
      `aria-describedby`

## 4. El formulario

- [x] 4.1 Sustituir el campo de institución por el selector
- [x] 4.2 **No cambia ninguna regla de validación**, ni en el navegador ni en el servidor
- [x] 4.3 El resto de campos se quedan como están

## 5. Pruebas

- [x] 5.1 "antioquia" en minúscula encuentra "ANTIOQUIA"
- [x] 5.2 "aeronautica" sin tilde encuentra "AERONÁUTICOS"
- [x] 5.3 Un término sin coincidencias devuelve lista vacía, no el listado entero
- [x] 5.4 El listado versionado no tiene duplicados y está ordenado
- [x] 5.5 Mutar el normalizado de tildes debe romper alguna prueba; si no, la prueba no prueba.
      Al primer intento rompieron 2 en vez de 4: **la mutación no había aplicado**, por el escapado
      del script. Bien aplicada rompen 4

## 6. Verificación en el navegador

- [x] 6.1 **El fallo original**: con una subida en curso, cerrar la ventana y ver la confirmación
      **encima**
- [x] 6.2 Que no se rompió lo que ya iba: cerrar sesión, y cancelar desde el formulario, donde no
      hay ninguna ventana modal de por medio
- [x] 6.3 Escribir "nacional" y comprobar que la Nacional aparece **una sola vez**
- [x] 6.4 Escribir en minúscula y sin tildes
- [x] 6.5 Recorrer con flechas, elegir, y cerrar sin elegir conservando lo escrito
- [x] 6.6 Escribir una institución que **no** está en el listado y enviar: se acepta
- [x] 6.7 Enviar una con tilde y comprobar en la tabla que **llega con su tilde**. Una creada con
      `curl` llegó rota y otra creada **desde el formulario** llegó intacta: era Git Bash manglando
      el argumento, no la aplicación
- [x] 6.8 375 px: la lista no desborda ni provoca desplazamiento horizontal
- [x] 6.9 Consola sin violaciones de la política de seguridad y **sin ninguna petición externa**
- [x] 6.10 Limpiar los datos de prueba

## 7. Cierre del change

- [x] 7.1 `pnpm turbo lint typecheck test` en verde
- [x] 7.2 Escáner de secretos limpio
- [x] 7.3 Republicar el frontend y comprobar el flujo en el dominio real
- [x] 7.4 Anotar en las notas del AI-LOG lo del `z-index` que no era `z-index`
- [x] 7.5 Archivar el change y sincronizar la capability
- [x] 7.6 Cerrar con un único commit: `🐛 fix(web): aviso visible sobre modales y selector de institucion`
