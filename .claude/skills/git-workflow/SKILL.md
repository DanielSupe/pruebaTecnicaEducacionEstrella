---
name: git-workflow
description: Estándar de commits y uso de git en este repo (monorepo pnpm + Turborepo con web, api y shared). Úsala SIEMPRE que se vaya a hacer un commit o se vaya a cerrar/archivar un change de OpenSpec, y también antes de crear ramas, integrar develop en main o ejecutar cualquier operación de git que reescriba historial.
---

# Git workflow

Contexto: prueba técnica. El evaluador lee el historial de commits para ver la evolución
del trabajo. Penalizan un único commit con todo el proyecto y cualquier secreto versionado.
El historial es parte de la entrega: cuídalo.

## Regla principal: un commit por change de OpenSpec

- Cada change de `openspec/changes/<change-id>/` se cierra con **exactamente un commit**,
  que incluye el código implementado, la actualización de las specs y el archivado del change.
- El commit se hace **solo** cuando todas las tareas de `tasks.md` están completas y el
  change ya está archivado.
- **No hagas commits intermedios** mientras se implementa un change.
- Si el trabajo de un change resulta demasiado grande para un solo commit, **avisa al usuario
  y propón dividirlo en dos changes** — nunca en varios commits.
- Excepción: ajustes pequeños fuera de cualquier change (un typo, un ajuste de configuración)
  pueden ir en un commit propio, pero deben ser raros. Si se acumulan, sugiere crear un change.

## Formato del mensaje

Título: `<emoji> <tipo>(<scope>): <descripción>`

- Descripción en español, en imperativo, en minúscula, sin punto final.
- Título completo de **72 caracteres como máximo**.
- Scopes válidos: `web`, `api`, `shared`, `repo`. Si el change toca varios paquetes, usa el
  scope principal u omítelo.
- **Cuerpo obligatorio**, separado por una línea en blanco:
  - `OpenSpec: <change-id>`
  - Resumen de 2 a 4 líneas del **porqué**, tomado de `proposal.md`. No es una lista de
    archivos cambiados.

| Emoji | Tipo | Cuándo usarlo |
|---|---|---|
| ✨ | feat | Nueva funcionalidad |
| ⬆️ | improve | Mejora de algo que ya existe |
| 🐛 | fix | Corrección de un bug |
| 📝 | docs | README, AI-LOG.md y documentación |
| 🔧 | chore | Configuración, tooling y dependencias |

Ejemplo:

```
✨ feat(api): subida de video con presigned POST

OpenSpec: add-video-upload
El video va directo del navegador al almacenamiento sin pasar por
la API. Se usa POST en lugar de PUT para imponer el límite de
200 MB y el content-type en la política firmada.
```

## Antes de cada commit

1. Verifica que el change está completo (`tasks.md` sin pendientes) y **archivado**.
2. Revisa `git status` y `git diff --cached`, y ejecuta el escáner de secretos:

   ```bash
   bash .claude/skills/git-workflow/check-staged-secrets.sh
   ```

   **Bloquea el commit** si hay en staging `.env*` (excepto `.env.example`), `*.pem`, `*.key`,
   o contenido que parezca una credencial (`AKIA...`, `aws_secret_access_key`, tokens,
   contraseñas). Si encuentras alguno: detente, avisa al usuario y propón actualizar
   el `.gitignore`.
3. `pnpm-lock.yaml` **sí** se versiona: no lo excluyas ni lo saques del staging.
4. Ejecuta `pnpm turbo lint typecheck test`. Si falla, **no propongas el commit**.
5. Muestra el mensaje propuesto y **espera confirmación del usuario** antes de ejecutar
   `git commit`.

## Ramas

- Todo el desarrollo se hace en `develop`. **No crees ramas adicionales.**
- **Nunca** hagas commits directos a `main`.
- `develop` se integra a `main` solo cuando el usuario lo pida, siempre con **merge commit**
  (`--no-ff`) y **nunca con squash**, para conservar el historial completo.

## Prohibido sin autorización explícita del usuario

- `git push --force`, `git reset --hard` o cualquier reescritura de historial ya publicado
- Commits directos a `main`
- Crear ramas nuevas
- `--no-verify`

Ante la duda, pregunta antes de ejecutar.
