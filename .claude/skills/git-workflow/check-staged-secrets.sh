#!/usr/bin/env bash
# Revisa los archivos en staging en busca de secretos.
# Uso: bash .claude/skills/git-workflow/check-staged-secrets.sh
# Salida: 0 = limpio, 1 = hallazgos (NO hacer commit).

set -uo pipefail

findings=0
report() { printf '  [%s] %s\n' "$1" "$2"; findings=$((findings + 1)); }

files=$(git diff --cached --name-only --diff-filter=ACMR)
if [ -z "$files" ]; then
  echo "No hay archivos en staging."
  exit 0
fi

echo "Revisando archivos en staging..."

# 1. Rutas prohibidas
while IFS= read -r f; do
  base=$(basename "$f")
  case "$base" in
    .env.example|.env.sample|.env.template) continue ;;
    .env|.env.*) report "ruta" "$f (archivo .env versionado)" ;;
  esac
  case "$base" in
    *.pem)        report "ruta" "$f (clave/certificado .pem)" ;;
    *.key)        report "ruta" "$f (archivo .key)" ;;
    *.p12|*.pfx)  report "ruta" "$f (keystore)" ;;
    id_rsa|id_dsa|id_ecdsa|id_ed25519) report "ruta" "$f (clave SSH privada)" ;;
  esac
done <<< "$files"

# 2. Contenido que parece una credencial (solo líneas añadidas)
patterns='(AKIA|ASIA)[0-9A-Z]{16}
aws_secret_access_key
-----BEGIN [A-Z ]*PRIVATE KEY-----
gh[pousr]_[A-Za-z0-9]{20,}
sk-[A-Za-z0-9_-]{20,}
xox[abprs]-[A-Za-z0-9-]{10,}
eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}
(secret|token|password|passwd|api[_-]?key|client[_-]?secret)[[:space:]]*[:=][[:space:]]*.?[A-Za-z0-9/+_-]{12,}'

added=$(git diff --cached --unified=0 | grep -E '^\+' | grep -vE '^\+\+\+' || true)
noise='process\.env|import\.meta\.env|<your|your-|changeme|placeholder|xxxx|\$\{|\$\(|dotenv'

while IFS= read -r p; do
  [ -z "$p" ] && continue
  hits=$(printf '%s
' "$added" | grep -inE -- "$p" | grep -viE -- "$noise" | head -5 || true)
  if [ -n "$hits" ]; then
    while IFS= read -r h; do
      [ -z "$h" ] && continue
      report "contenido" "$(printf '%.140s' "$h")"
    done <<< "$hits"
  fi
done <<< "$patterns"

echo
if [ "$findings" -gt 0 ]; then
  echo "BLOQUEADO: $findings hallazgo(s). No hagas commit."
  echo "Saca el archivo del staging (git restore --staged <archivo>), añádelo al .gitignore"
  echo "y avisa al usuario antes de continuar."
  exit 1
fi

echo "OK: sin secretos detectados en staging."
exit 0
