## Why

El repositorio solo contiene el enunciado y los artefactos de OpenSpec. Antes de escribir una
sola línea de producto hace falta el esqueleto donde vivirán `web`, `api` y `shared`, y sobre
todo hace falta el `.gitignore`: el enunciado penaliza explícitamente _"credenciales, llaves de
acceso o secretos versionados en el repositorio"_ (sección 8), y los próximos changes van a
generar `.env`, `*.tfstate` y `*.tfvars` en disco. Crear el `.gitignore` **después** de que
existan esos archivos es cómo se cuelan los secretos en el historial, y un secreto commiteado
no se borra reescribiendo historial ya publicado.

Este change no entrega comportamiento de producto: entrega el suelo sobre el que se apoyan los
trece changes siguientes y el pipeline de calidad (`lint`, `typecheck`, `test`) que la skill
`git-workflow` exige ejecutar antes de cada commit.

## What Changes

- `.gitignore` en la raíz, cubriendo secretos (`.env*` salvo `.env.example`), estado de
  Terraform (`*.tfstate*`, `*.tfvars`, `.terraform/`), artefactos de build (`dist`, `.turbo`)
  y dependencias (`node_modules`).
- Workspace de pnpm (`pnpm-workspace.yaml`) con `apps/*` y `packages/*`.
- `turbo.json` con las tareas `lint`, `typecheck`, `test` y `build`, y sus dependencias entre
  paquetes.
- `package.json` raíz con los scripts que envuelven a Turborepo y `packageManager` fijado.
- Configuración base de TypeScript compartida y extendida por cada paquete.
- ESLint + Prettier en la raíz, aplicables a los tres paquetes.
- Esqueleto de `apps/web`, `apps/api`, `packages/shared` e `infra/`: cada uno con su
  `package.json` y su `tsconfig.json`, sin código de producto todavía.
- Se integra el `openspec/config.yaml` ya modificado que está pendiente de commitear.

## Capabilities

### New Capabilities

Ninguna. Este change es puramente de tooling y estructura: no introduce comportamiento
observable por el usuario ni requisitos que especificar. Por eso `.openspec.yaml` lleva
`skip_specs: true`.

### Modified Capabilities

Ninguna.

## Alternativas descartadas

- **pnpm workspaces sin Turborepo.** A esta escala (tres paquetes) Turborepo aporta poco más
  que un pipeline unificado, y es una dependencia que hay que saber defender. Se mantiene
  porque el comando único `pnpm turbo lint typecheck test` es exactamente lo que la skill
  `git-workflow` ejecuta antes de cada commit, y porque la caché de tareas ahorra tiempo real
  en un plazo de 3–5 días. Si en la entrevista se cuestiona, la respuesta honesta es esa: a
  esta escala es comodidad, no necesidad.
- **Repositorios separados para web, api e infra.** Se descarta porque el valor de
  `packages/shared` es que el mismo esquema Zod valide en cliente y servidor; con repos
  separados eso exige publicar un paquete versionado, que es más ceremonia de la que justifica
  una prueba técnica.
- **Crear el `.gitignore` en el change de infraestructura, junto a Terraform.** Se descarta por
  el motivo del "Why": para entonces ya existirían `.env` y `.tfstate` en disco, y basta un
  `git add -A` distraído para versionar un secreto.
- **Nx en lugar de Turborepo.** Más potente y más pesado; su generación de código y su grafo de
  proyectos no aportan nada con tres paquetes.
- **Esqueletos vacíos vs. andamiaje generado (`create-vite`, etc.).** El andamiaje completo de
  Vite se deja para `setup-web-foundation`, para que este change no mezcle tooling de raíz con
  configuración de frontend y siga cerrándose en un commit de tamaño razonable.

## Requisitos del enunciado que cubre

- **Sección 8 (señales penalizadas)**: evita secretos versionados desde el primer commit.
- **Sección 5.1 (entregables)**: historial de commits legible — este es el primer eslabón de la
  cadena de un commit por change.
- **Sección 7, "Calidad de código y documentación"**: estructura y legibilidad; habilita el
  `pnpm turbo lint typecheck test` que se ejecuta antes de cada commit posterior.

## Impact

- Archivos nuevos en la raíz: `.gitignore`, `pnpm-workspace.yaml`, `turbo.json`,
  `package.json`, `tsconfig.base.json`, configuración de ESLint y Prettier.
- Directorios nuevos: `apps/web`, `apps/api`, `packages/shared`, `infra`.
- Sin cambios de API, de datos ni de infraestructura desplegada.
- Desbloquea: `add-shared-schemas`, `setup-infra-base`, `add-api-foundation` y
  `setup-web-foundation`.
