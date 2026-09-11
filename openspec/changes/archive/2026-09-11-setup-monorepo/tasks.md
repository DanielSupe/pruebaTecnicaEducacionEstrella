## 1. Blindaje del repositorio

- [x] 1.1 Crear `.gitignore` en la raíz antes que cualquier otro archivo: `node_modules/`, `dist/`, `.turbo/`, `*.log`, `.DS_Store`, `.env*` con excepción explícita `!.env.example`, `*.tfstate`, `*.tfstate.*`, `*.tfvars`, `!*.tfvars.example`, `.terraform/`, `*.pem`, `*.key`. Ojo: `.terraform.lock.hcl` **sí** se versiona, no lo excluyas
- [x] 1.2 Verificar que las exclusiones funcionan: crear un `.env` de prueba en la raíz y en `apps/api`, comprobar con `git status` que no aparecen, y borrarlos
- [x] 1.3 Ejecutar `bash .claude/skills/git-workflow/check-staged-secrets.sh` y confirmar que sale limpio

## 2. Workspace y gestor de paquetes

- [x] 2.1 Crear `pnpm-workspace.yaml` con `apps/*` y `packages/*`
- [x] 2.2 Crear el `package.json` raíz como privado, con `packageManager` fijado a la versión de pnpm en uso y `engines.node`
- [x] 2.3 Añadir los scripts raíz que envuelven a Turborepo: `lint`, `typecheck`, `test`, `build`, `dev`
- [x] 2.4 Instalar `turbo` como dependencia de desarrollo de la raíz y crear `turbo.json` con las tareas `lint`, `typecheck`, `test` y `build`, declarando que `build` depende de `^build` y que `typecheck` de un paquete depende del `build` de sus dependencias

## 3. TypeScript y calidad

- [x] 3.1 Crear `tsconfig.base.json` en la raíz: `strict: true`, `target`/`lib` modernos, `moduleResolution: "Bundler"`, `noUncheckedIndexedAccess`, `isolatedModules`
- [x] 3.2 Configurar ESLint en la raíz (flat config) con el plugin de TypeScript, aplicable a los tres paquetes, ignorando `dist` y `.turbo`
- [x] 3.3 Configurar Prettier y verificar que no entra en conflicto con las reglas de formato de ESLint
- [x] 3.4 Añadir `.editorconfig` para normalizar finales de línea, dado que se desarrolla en Windows y se despliega en Linux

## 4. Esqueleto de paquetes

- [x] 4.1 Crear `packages/shared` con su `package.json` (nombre con scope, `type: "module"`, exports) y su `tsconfig.json` extendiendo el base. Sin esquemas todavía: los añade `add-shared-schemas`
- [x] 4.2 Crear `apps/api` con `package.json` y `tsconfig.json`, declarando la dependencia de workspace a `shared`. Sin Express todavía: lo añade `add-api-foundation`
- [x] 4.3 Crear `apps/web` con `package.json` y `tsconfig.json`, declarando la dependencia de workspace a `shared`. Sin Vite todavía: lo añade `setup-web-foundation`
- [x] 4.4 Crear `infra/` con un `README.md` de una línea que indique que Terraform llega en `setup-infra-base`, para que el directorio exista en git
- [x] 4.5 Añadir a cada paquete los scripts `lint`, `typecheck` y `test` que Turborepo va a invocar, aunque de momento no haya nada que comprobar

## 5. Verificación

- [x] 5.1 `pnpm install` completa y genera `pnpm-lock.yaml` (que **sí** se versiona)
- [x] 5.2 `pnpm turbo lint typecheck test` pasa en los tres paquetes
- [x] 5.3 Confirmar que `pnpm-lock.yaml` aparece en `git status` y que `node_modules/` no
- [x] 5.4 Revisar que la resolución de `shared` desde `api` y `web` funciona (import de prueba que se elimina después, o `tsc --noEmit` sobre un fichero temporal)

## 6. Cierre del change

- [x] 6.1 Integrar el `openspec/config.yaml` modificado que estaba pendiente de commitear
- [x] 6.2 Archivar el change con `openspec archive setup-monorepo`
- [x] 6.3 Cerrar con un único commit siguiendo la skill `git-workflow`: `🔧 chore(repo): base del monorepo pnpm y turborepo`
