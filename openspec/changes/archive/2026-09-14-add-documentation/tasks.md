## 1. La decisión que faltaba

- [x] 1.1 Escribir la comparación entre Lambda y contenedor, que no existía en ningún sitio
- [x] 1.2 Debe decir **qué se pierde**: arranques en frío y una depuración menos cómoda que la de
      un proceso al que puedes conectarte
- [x] 1.3 Debe decir **qué NO fue un argumento**, aunque lo parezca: un contenedor habla con los
      mismos servicios por el mismo SDK, y el límite de tamaño de petición obliga a la subida
      firmada en los dos casos
- [x] 1.4 Debe decir en qué caso concreto se elegiría lo contrario

## 2. README

- [x] 2.1 Qué es el proyecto y dónde está desplegado
- [x] 2.2 Usuario de prueba: existe, y las credenciales viajan en el mensaje de entrega.
      **Ninguna contraseña en el repositorio** — comprobado buscándolas
- [x] 2.3 Arquitectura en diagrama de texto: legible en el navegador, en la terminal y en un diff
- [x] 2.4 El recorrido de una solicitud, incluido **por dónde viaja el vídeo**, que no pasa por la
      API. Es lo que más cuesta deducir del código
- [x] 2.5 Cómo levantarlo en local: requisitos, variables y de dónde salen, orden de arranque
- [x] 2.6 Las **cuatro decisiones que nombra el enunciado**, con ese nombre, para que quien las
      busque las encuentre
- [x] 2.7 Las decisiones propias que valen la pena: modelado en una sola tabla, estados de la
      solicitud, limpieza de huérfanos, origen único
- [x] 2.8 Cada decisión dice qué se sacrifica. Una decisión solo con ventajas está anunciada, no
      sustentada
- [x] 2.9 Limitaciones conocidas, sin suavizar
- [x] 2.10 Qué se haría con más tiempo
- [x] 2.11 Estructura del repositorio, enlazando a `infra/README.md` **sin duplicarlo**
- [x] 2.12 No previsto: `infra/README.md` decía que Lambda, API Gateway y CloudFront "llegan en el
      change setup-deployment". Ya habían llegado; corregido junto con el resto de su contenido

## 3. Limitaciones que hay que recoger

Se fueron anotando al cerrar cada change, para no depender de la memoria:

- [x] 3.1 La API es alcanzable directamente, sin pasar por la distribución. Por qué se asume
- [x] 3.2 `unsafe-inline` en estilos, y por qué el riesgo es de otro orden que en script
- [x] 3.3 No se inspecciona el contenido real del vídeo, solo tipo declarado y tamaño
- [x] 3.4 El registro no verifica el correo
- [x] 3.5 Los tokens viven en el navegador, y qué lo mitiga
- [x] 3.6 El tope de concurrencia es de cuenta, no por función, porque la cuenta no permite
      reservar
- [x] 3.7 El estado de Terraform es local y no se versiona
- [x] 3.8 El registro del certificado se añade a mano, porque el DNS vive en el registrador
- [x] 3.9 Sin índice por estado: no hay panel administrativo que lo consuma

## 4. AI-LOG

- [x] 4.1 **Una o dos páginas.** Hay unas 4.200 palabras de notas: hay que recortar cuatro de cada
      cinco. La extensión es parte del encargo, no una sugerencia
- [x] 4.2 Cómo se usó: los tres pasos de cada cambio y por qué ese proceso
- [x] 4.3 **Propuestas rechazadas**, con el motivo: la librería de formularios, los errores de
      credenciales en línea, un nombre que se leía como aprobación de crédito
- [x] 4.4 **Premisas equivocadas que hubo que corregir**: las tres del origen único, que cambiaron
      la política de seguridad entera
- [x] 4.5 **Funcionalidad que entró en contra de la recomendación**, y que se construyó igual
- [x] 4.6 **Comprobaciones que no comprobaban nada**: la cancelación que perdía la carrera, la
      construcción que "fallaba" con código de salida 0, el contraste medido leyendo mal el
      formato de color. Es lo que peor deja y lo que más dice del criterio
- [x] 4.7 Sin adornos y sin lista de logros

## 5. Verificación

- [x] 5.1 **Seguir el arranque local desde cero, en un directorio limpio.** Clon nuevo, sin
      `.env` ni estado de Terraform: `pnpm install` correcto, y saltarse un paso falla con código
      1 y mensaje claro en los dos casos. **`terraform apply` NO se ejecutó**: duplicaría la
      infraestructura que está viva. Apareció que la API, sin `.env`, falla con un mensaje de Node
      poco explicativo; se avisa en el README
- [x] 5.2 Comprobar que cada enlace del README resuelve
- [x] 5.3 Contar las palabras del AI-LOG
- [x] 5.4 Comprobar que las cuatro decisiones nombradas por el enunciado están, con ese nombre
- [x] 5.5 Abrir la URL desplegada y entrar con el usuario de prueba
- [x] 5.6 Buscar credenciales y valores reales de configuración en lo que se va a versionar

## 6. Cierre del change

- [x] 6.1 `pnpm turbo lint typecheck test` en verde
- [x] 6.2 Escáner de secretos limpio
- [x] 6.3 Archivar el change y sincronizar la capability
- [x] 6.4 Cerrar con un único commit: `📝 docs(repo): readme y bitacora de trabajo con ia`
