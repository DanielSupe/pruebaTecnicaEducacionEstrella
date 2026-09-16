## 1. Antes de tocar nada

- [x] 1.1 Emitir el JavaScript con los comentarios quitados y guardarlo. Es la referencia contra la
      que se comprobará al final que **solo cambiaron comentarios**
- [x] 1.2 Anotar el recuento de líneas de comentario de partida: 1.051 de producto, 121 de pruebas,
      242 de infraestructura

## 2. Código de producto

Archivo por archivo, aplicando el criterio. Los de mayor densidad marcan el tono:
`uploads.ts` (40 %), `video.ts` (50 %), `format.ts` (53 %), `Modal.tsx` (36 %).

- [x] 2.1 Fuera lo que repite la línea siguiente
- [x] 2.2 Fuera las explicaciones de diseño que no encierran ninguna trampa
- [x] 2.3 Fuera las referencias a en qué change se decidió algo: para eso está el historial
- [x] 2.4 **Se quedan** las restricciones externas invisibles: el archivo al final del formulario,
      la región reservada, el top layer frente al `z-index`, el certificado en una región concreta
- [x] 2.5 **Se quedan** las propiedades de seguridad que parecen arbitrarias: la partición desde el
      token, el mensaje genérico de credenciales, la etiqueta que nace pendiente
- [x] 2.6 **Se quedan** los sitios donde la mejora obvia es incorrecta: la referencia al foco que no
      se limpia, el token que no se cachea
- [x] 2.7 Los que quedan, en inglés y más cortos: si hacían falta seis líneas, probablemente sobran
      cuatro
- [x] 2.8 **No se toca ningún texto que ve el usuario ni ningún mensaje de validación**

## 3. Pruebas

- [x] 3.1 Mismo criterio
- [x] 3.2 **Se quedan** los que documentan un fallo que llegó a ocurrir: sin ellos la prueba parece
      arbitraria y alguien la borra
- [x] 3.3 **No se traducen los nombres de las pruebas**: son cadenas, no comentarios, y sería un
      diff enorme sin beneficio

## 4. Infraestructura y scripts

- [x] 4.1 Mismo criterio en los doce archivos de Terraform y en los scripts
- [x] 4.2 Sobreviven casi todos los de Terraform, y con razón: describen trampas del proveedor que
      no se deducen de la declaración
- [x] 4.3 En particular se queda el bloque de `username_attributes` frente a `alias_attributes`:
      es el que evita usuarios que se registran bien y nunca pueden entrar

## 5. Que no se deshaga

- [x] 5.1 `CLAUDE.md`: los comentarios van en inglés y solo cuando evitan un error
- [x] 5.2 Sin esa línea, el próximo cambio vuelve a comentar en español y esto se deshace solo

## 6. Verificación

- [x] 6.1 **Emitir de nuevo el JavaScript sin comentarios y compararlo con la referencia del paso
      1.1.** Si es idéntico, el cambio tocó solo comentarios. Es una garantía mecánica, no una
      impresión al leer el diff — que es justo donde se cuela un borrado accidental
- [x] 6.2 `terraform plan` sin cambios pendientes: el equivalente para la infraestructura
- [x] 6.3 `pnpm turbo lint typecheck test` en verde, 245 pruebas
- [x] 6.4 Ningún texto de usuario ni mensaje de validación quedó en inglés
- [x] 6.5 Ningún comentario huérfano: bloques que se quedaron sin el código que describían
- [x] 6.6 Recuento final. **Sobrevive el 47 %, no el 15-20 % estimado.** La estimación estaba
      mal, no la ejecución: los comentarios eran bloques de seis a doce líneas que ahora son de dos
      o tres, así que su número cayó mucho más que el de líneas. Bajar al 15 % exigiría borrar
      comentarios que cumplen el criterio, que sería cumplir el número incumpliendo la regla
- [x] 6.7 Leer entero uno de los archivos más afectados y comprobar que **se sigue entendiendo**

## 7. Cierre del change

- [x] 7.1 Escáner de secretos limpio
- [x] 7.2 Archivar el change y sincronizar la capability
- [x] 7.3 Cerrar con un único commit: `🔧 chore(repo): comentarios solo donde evitan un error`
