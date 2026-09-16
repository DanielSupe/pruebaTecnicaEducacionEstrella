#!/usr/bin/env bash
#
# Publishes the frontend: build, sync, invalidate.
#
# Values come from Terraform outputs, never written by hand. Order matters: run
# `terraform apply` first, or there is no bucket to upload to.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA="$RAIZ/infra"

leer_salida() {
  terraform -chdir="$INFRA" output -raw "$1" 2>/dev/null || {
    echo "No se pudo leer la salida '$1' de Terraform." >&2
    echo "¿Has aplicado la infraestructura? Ejecuta: terraform -chdir=infra apply" >&2
    exit 1
  }
}

BUCKET="$(leer_salida web_bucket_name)"
DISTRIBUCION="$(leer_salida cloudfront_distribution_id)"
URL="$(leer_salida web_url)"
USER_POOL_ID="$(leer_salida cognito_user_pool_id)"
CLIENT_ID="$(leer_salida cognito_user_pool_client_id)"

echo "Construyendo el frontend…"

# The API address is RELATIVE, so the bundle can be built without knowing the
# domain.
#
# MSYS_NO_PATHCONV only HERE, not exported for the whole script: Git Bash on
# Windows rewrites values that look like Unix paths before passing them to a native
# program, so "/api/v1" would arrive as "C:/Program Files/Git/api/v1". Disabling the
# conversion globally breaks the terraform calls, which do need their path
# translated.
MSYS_NO_PATHCONV=1 \
VITE_API_BASE_URL="/api/v1" \
VITE_COGNITO_USER_POOL_ID="$USER_POOL_ID" \
VITE_COGNITO_CLIENT_ID="$CLIENT_ID" \
  pnpm --filter @educacion-estrella/web build

DIST="$RAIZ/apps/web/dist"
[ -d "$DIST" ] || { echo "No existe $DIST tras construir." >&2; exit 1; }

echo "Subiendo a s3://$BUCKET…"

# Two passes, and the order matters. Fingerprinted files first: their names carry a
# content hash, so they never change and can be cached for a year. They go up BEFORE
# the index, so that when the new index starts being served the files it points at
# are already there.
aws s3 sync "$DIST" "s3://$BUCKET" \
  --delete \
  --exclude "index.html" \
  --cache-control "public, max-age=31536000, immutable"

# The index is NOT cached: it is the only file whose name never changes, so caching
# it would leave people on the previous version indefinitely.
aws s3 cp "$DIST/index.html" "s3://$BUCKET/index.html" \
  --cache-control "no-cache, must-revalidate" \
  --content-type "text/html; charset=utf-8"

echo "Invalidando la cache de la distribucion…"
# The same Git Bash path conversion bites here.
INVALIDACION="$(MSYS_NO_PATHCONV=1 aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUCION" \
  --paths "/index.html" \
  --query 'Invalidation.Id' --output text)"

echo
echo "Publicado: $URL"
echo "Invalidacion en curso: $INVALIDACION"
