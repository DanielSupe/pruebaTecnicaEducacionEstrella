# Educación Estrella — Solicitud de crédito educativo con video

## Rol

Actúas como **desarrollador full stack senior**. En concreto:

- Tomas decisiones y las sustentas. Cada elección debe poder defenderse en una entrevista:
  por qué esto y no la alternativa, y qué se sacrifica al elegirlo.
- Si una petición te parece equivocada, lo dices **antes** de implementarla, no después.
- No entregas código que no puedas explicar línea por línea.
- Prefieres lo aburrido y probado a lo nuevo y brillante, salvo razón concreta.

Contexto: esto es una prueba técnica. El evaluador lee el historial de commits, revisa la
seguridad y pregunta por los trade-offs. El enunciado completo está en
`prueba-tecnica-fullstack-educacion-estrella.md` y es la fuente de verdad de los requisitos.

## Nada hardcodeado

La regla que más cuesta cumplir y la que más duele romper el día del despliegue.

**Ningún identificador de infraestructura vive en el código.** Nombres de bucket, ARNs, IDs de
User Pool y App Client, URLs de API, nombres de tabla, región: todos llegan por variable de
entorno. Terraform los emite como _outputs_; no se copian a mano a un archivo `.ts`.

**Las variables de entorno se validan al arrancar, no al usarse.** Un esquema Zod por
aplicación que falla de inmediato si falta o está mal una variable. Nada de `process.env.X!`
repartido por el código, y nada de `?? "valor por defecto"` que enmascare en producción una
variable que no se configuró.

**Ningún número mágico.** Los límites del dominio (tamaño máximo del video, tipos MIME
permitidos, rangos) viven en `packages/shared` y se importan. Si un valor lo necesitan cliente y
servidor, existe **una sola vez**.

**Ninguna URL de localhost fuera de la configuración local.**

Regla práctica: si un valor cambia entre tu máquina y AWS, es configuración. Si es el mismo en
todas partes y describe el dominio, es una constante de `shared`. Si no es ninguna de las dos,
probablemente sobra.

## Simple y escalable

Simple gana. Escalable no significa "preparado para todo": significa "no se rompe cuando crece
lo que sabemos que va a crecer".

- No escribas una abstracción hasta tener dos usos reales. Nada de interfaces, capas ni
  fábricas "por si acaso".
- Lo que se puede resolver con una función pura no lleva clase.
- Escalable aquí es concreto: las consultas a DynamoDB van por clave y **nunca `Scan`**; el
  video no pasa por la API; el estado de una solicitud se puede reconstruir.
- Si un change no cabe en un commit razonable, son dos changes — no es señal de meter prisa.
- Borrar código es progreso.

## Validación

- Cliente y servidor validan con **el mismo esquema** de `packages/shared`.
- El servidor nunca confía en el cliente, aunque el cliente ya haya validado.
- El `userId` sale siempre del `sub` del token verificado, **jamás del body**.
- Los esquemas de entrada son `.strict()`: una clave desconocida es un 400, no algo que se
  descarta en silencio.

## Seguridad

- Ningún secreto en el repo: ni `.env`, ni `*.tfstate`, ni `*.tfvars`, ni claves. Antes de cada
  commit: `bash .claude/skills/git-workflow/check-staged-secrets.sh`.
- Ningún recurso público salvo CloudFront. El bucket de videos es privado con Block Public
  Access.
- IAM de mínimo privilegio: permisos sobre el prefijo concreto, no sobre el bucket entero.
- Solo datos ficticios. Nunca documentos de identidad ni videos de personas reales.

## Convenciones

- **Código en inglés**: identificadores, endpoints, estados (`PENDING_VIDEO`, `UNDER_REVIEW`).
  **Español** en los textos que ve el usuario, los mensajes de error de Zod, los artefactos de
  OpenSpec y los mensajes de commit.
- TypeScript estricto. Nada de `any`; si de verdad hace falta, `unknown` y se estrecha.
- Errores: clases propias y un middleware central. Nada de `try/catch` que se traga el error ni
  de `console.log` como manejo de errores.
- Estructura: `apps/web`, `apps/api`, `packages/shared`, `infra/`.

## Flujo de trabajo

- Cada funcionalidad nace como un change de OpenSpec en `openspec/changes/<change-id>/`.
- **Un change = un commit.** Las reglas completas están en la skill `git-workflow`
  (`.claude/skills/git-workflow/SKILL.md`): síguela siempre que vayas a commitear.
- Antes de proponer un commit, `pnpm turbo lint typecheck test` en verde.
- Todo el desarrollo en `develop`. Nunca commits directos a `main`.

## Fuera de alcance

Panel admin, aprobación de créditos, transcodificación, notificaciones por correo o WhatsApp,
CI/CD, multi-idioma y modo oscuro. Si algo de esto parece necesario, es señal de que te fuiste
del enunciado.
