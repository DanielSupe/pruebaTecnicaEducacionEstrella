## 1. Reordenar los caminos

- [x] 1.1 Tres caminos en lugar de dos, de menos a más esfuerzo
- [x] 1.2 **Solo el frontend contra la API desplegada** va primero: ni Terraform, ni API local, ni
      credenciales de AWS
- [x] 1.3 Decir por qué funciona: el origen de desarrollo está autorizado en el CORS desplegado,
      tanto en la API como en el almacenamiento, así que también la subida del vídeo
- [x] 1.4 Segundo camino: frontend y API en local
- [x] 1.5 Tercero: crear la infraestructura desde cero

## 2. Las credenciales

- [x] 2.1 Mencionar **brevemente** que también pueden ir en el propio archivo de entorno
- [x] 2.2 Sin extenderse: es el dato que faltaba para poder actuar, no un apartado

## 3. El aviso de entrada

- [x] 3.1 Separar las dos cosas que ahora van juntas: que **no hay emulación local**, que es la
      limitación real, y que **no hay nada que desplegar** para verlo funcionar
- [x] 3.2 Conservar lo de que las pruebas corren sin AWS

## 4. Lo que no cambia

- [x] 4.1 **Ningún identificador concreto en el documento**: se dice de dónde salen
- [x] 4.2 Ninguna credencial
- [x] 4.3 Ni una línea de código

## 5. Verificación

- [x] 5.1 Seguir el primer camino tal como queda escrito, desde la plantilla vacía: acceso,
      formulario, **subida directa al almacenamiento** y confirmación, todo desde `localhost:5173`
      contra la API desplegada y **sin ninguna credencial de AWS**
- [x] 5.2 Comprobar que el README no contiene ningún identificador de este despliegue
- [x] 5.3 Los enlaces siguen resolviendo

## 6. Cierre del change

- [x] 6.1 `pnpm turbo lint typecheck test` en verde
- [x] 6.2 Escáner de secretos limpio
- [x] 6.3 Archivar el change y sincronizar la capability
- [x] 6.4 Cerrar con un único commit: `📝 docs(repo): el camino mas corto de arranque va primero`
