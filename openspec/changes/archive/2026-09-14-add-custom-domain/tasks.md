## 1. Comprobación previa

- [x] 1.1 Confirmar que el dominio usa los servidores de nombres del registrador. Si apunta a
      otro proveedor, los registros se añadirían en un panel que nadie consulta y la validación
      no llegaría nunca. **Comprobarlo antes de pedir el certificado**, no después de esperar
- [x] 1.2 Confirmar la ortografía exacta del subdominio: queda dentro del certificado y cambiarla
      obliga a emitir otro

## 2. Certificado

- [x] 2.1 Certificado público para el subdominio, validación por DNS
- [x] 2.2 En `us-east-1`, que no es una eleccion: CloudFront solo acepta certificados de esa
      región. Aquí coincide con la del proyecto, así que no hace falta un segundo proveedor
- [x] 2.3 `create_before_destroy`, para que un cambio futuro de nombre no deje la distribución sin
      certificado mientras se emite el nuevo
- [x] 2.4 El nombre y el valor del registro de validación se publican como salida, para poder
      dárselos a quien administra el DNS sin leerlos del estado

## 3. Registro de validación

- [x] 3.1 Aplicar **solo el certificado** primero, para obtener los valores sin esperar bloqueado
- [x] 3.2 Entregar el registro con el `Host` ya recortado: el panel del registrador añade el
      dominio por su cuenta, y pegar el nombre completo produce un registro duplicado que no
      valida nunca
- [x] 3.3 Indicar que el valor va **sin el punto final** con el que lo escribe el certificador
- [x] 3.4 Esperar a que el certificado quede emitido antes de seguir

## 4. Alias en la distribución

- [x] 4.1 Declarar el subdominio como alias
- [x] 4.2 Sustituir el certificado por omisión por el nuestro, con negociación por nombre de
      servidor y versión mínima de TLS moderna
- [x] 4.3 El dominio generado **sigue funcionando**: el alias se suma
- [x] 4.4 Añadir el nuevo origen al CORS del almacenamiento de vídeos. Sin esto, la subida falla
      solo desde el dominio nuevo y el resto parece correcto

## 5. Registro del subdominio

- [x] 5.1 Entregar el segundo registro **después** de que la distribución reconozca el alias:
      al revés, CloudFront responde un error que parece una avería y es una secuencia mal hecha
- [x] 5.2 Esperar a la propagación y comprobarla resolviendo el nombre, no suponiéndola. Hizo
      falta distinguir dos síntomas idénticos: primero el registro **no estaba** (el autoritativo
      devolvía SOA), y después sí estaba pero el `NXDOMAIN` anterior seguía cacheado hasta una
      hora. Se demostró con `--resolve`, saltándose el DNS

## 6. Verificación

- [x] 6.1 El subdominio carga la aplicación sobre HTTPS, **sin advertencia de certificado**
- [x] 6.2 Comprobar la cadena del certificado: emitido para ese nombre y vigente
- [x] 6.3 La dirección original de la distribución **sigue sirviendo**
- [x] 6.4 Un nombre no declarado como alias se rechaza. Más fuerte de lo previsto: por HTTPS ni
      siquiera se ofrece certificado (falla el handshake), y por HTTP responde 403
- [x] 6.5 Acceso, envío de solicitud **con subida de vídeo** y reproducción, todo desde el dominio
      nuevo
- [x] 6.6 Consola del navegador **sin violaciones de la política** en todo el recorrido
- [x] 6.7 Las cabeceras de seguridad llegan también por el dominio nuevo
- [x] 6.8 `terraform plan` sin cambios pendientes

## 7. Cierre del change

- [x] 7.1 `pnpm turbo lint typecheck test` en verde
- [x] 7.2 Escáner de secretos limpio. **El dominio del propietario no es un secreto**, pero
      revisar que no entre ninguna credencial del registrador
- [x] 7.3 Anotar en las notas del AI-LOG lo que haya aparecido
- [x] 7.4 Anotar para el README: el paso manual del DNS y por qué se acepta
- [x] 7.5 Archivar el change y sincronizar la capability
- [x] 7.6 Cerrar con un único commit: `✨ feat(repo): dominio propio con certificado`
