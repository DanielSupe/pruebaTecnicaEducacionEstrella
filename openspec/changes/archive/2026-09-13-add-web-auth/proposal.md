## Why

El requisito 3.1 pide registro, inicio de sesión, sesión persistente y ruta protegida. Nada de
eso existe todavía en el navegador: la API ya sabe verificar tokens, pero no hay quien los emita
ni quien los adjunte.

Este change cierra el primer ciclo completo del roadmap. A partir de aquí se puede entrar en la
aplicación como lo hará quien la evalúe, y los endpoints de solicitudes nacen ya con alguien
identificado detrás.

## What Changes

- Pantallas de registro e inicio de sesión, y cierre de sesión desde la cabecera.
- La ruta principal pasa a estar protegida; registro e inicio de sesión quedan públicas.
- El estado de sesión se resuelve como una consulta más, de modo que la protección de rutas y la
  interfaz lean la misma fuente.
- Cada petición a la API adjunta el token de acceso vigente.
- Cuando la sesión caduca, se avisa y se lleva a iniciar sesión, en lugar de dejar al usuario
  ante una pantalla que ya no va a funcionar.
- Se incorpora la librería de ventanas emergentes, tematizada con los tokens del sistema de
  diseño y accesible solo a través de un envoltorio propio.
- Las variables del directorio de usuarios se suman al esquema de configuración del frontend.

## Capabilities

### Modified Capabilities

- `autenticacion`: hasta ahora describía qué exige la API a quien la llama. Se añade la otra
  mitad — cómo obtiene un solicitante esas credenciales, cómo se mantienen entre visitas y qué
  ocurre cuando dejan de valer.

## Alternativas descartadas

- **Guardar la sesión en un contexto de React.** Duplicaría la caché, la invalidación y los
  estados de carga que la capa de consultas ya ofrece. Además el guardián de rutas se ejecuta
  fuera de React y no podría leer ese contexto, así que acabaría habiendo dos fuentes de verdad.
- **Guardar el token y reutilizarlo mientras "parezca" vigente.** La librería de autenticación ya
  decide cuándo renovar. Cachearlo por nuestra cuenta significa enviar tokens caducados justo
  cuando alguien lleva un rato trabajando, que es el peor momento.
- **Usar el inicio de sesión automático que ofrece la librería tras el registro.** Es una ruta
  distinta de la del inicio de sesión normal, con su propio comportamiento ante errores. Llamar
  al mismo inicio de sesión que usa la pantalla de acceso reutiliza un camino ya probado.
- **Enviar el token de identidad en lugar del de acceso.** Ya está descartado del lado de la API,
  que lo rechaza explícitamente. Aquí solo se cumple.
- **Mostrar los errores de credenciales bajo el formulario.** Se valoró, porque evita cerrar una
  ventana antes de corregir. Se decidió mantener una sola regla sin excepciones: todo fallo de
  una acción que el usuario lanzó se muestra en ventana emergente. Se mitiga con que la ventana
  no tape el formulario y que el foco vuelva al campo al cerrarla.
- **Construir las ventanas emergentes a mano.** La trampa de foco, el cierre con teclado y los
  atributos de accesibilidad son la parte difícil de un modal y la que suele quedar mal.

## Requisitos del enunciado que cubre

- **3.1**: registro, inicio de sesión, sesión persistente, ruta protegida y cierre de sesión.
- **Sección 7, "Seguridad"**: protección de rutas en el cliente, además de la que ya hace la API.
- **Sección 7, "Frontend"**: estados de carga y error visibles en cada operación.

## Impact

- `apps/web/`: pantallas, guardián de rutas, estado de sesión, interceptor y envoltorio de
  ventanas emergentes.
- Sin cambios en la API ni en la infraestructura: el directorio de usuarios ya existe y está
  verificado.
- Desbloquea el formulario de solicitud y el listado, que nacen con un usuario identificado.
