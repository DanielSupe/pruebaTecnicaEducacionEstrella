## MODIFIED Requirements

### Requirement: El proyecto explica cómo levantarlo

El repositorio MUST incluir instrucciones para ejecutar el proyecto en local. Las instrucciones
MUST poder seguirse desde cero, sin depender de nada que solo exista en la máquina de quien las
escribió.

Cuando haya varias formas de arrancarlo, MUST presentarse **ordenadas por esfuerzo**, y la que
menos pida MUST ir primero. Quien recibe el proyecto no debería tener que leerlo entero para
descubrir que lo más corto le bastaba.

MUST indicarse qué variables de entorno hacen falta, de dónde salen y **dónde se escriben**. Decir
que hace falta un valor sin decir dónde ponerlo deja las instrucciones a medias.

MUST NOT incluirse ningún valor real de configuración ni ninguna credencial: el repositorio lo
puede desplegar cualquiera, y fijar los identificadores de un despliegue concreto dejaría las
instrucciones equivocadas para el resto.

#### Scenario: Alguien clona el repositorio y sigue las instrucciones

- **WHEN** se siguen los pasos en un entorno limpio
- **THEN** la aplicación arranca, sin pasos que no estén escritos

#### Scenario: La infraestructura ya está desplegada

- **WHEN** quien lo recibe solo quiere verlo funcionar
- **THEN** encuentra al principio un camino que no exige desplegar nada

#### Scenario: Falta configuración

- **WHEN** se intenta arrancar sin haber configurado las variables
- **THEN** el fallo indica qué falta, y el documento explica de dónde sale y dónde se escribe
