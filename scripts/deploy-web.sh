#!/usr/bin/env bash
#
# Publica el frontend: construye, sincroniza e invalida.
#
# Los valores salen de las salidas de Terraform, nunca escritos a mano. Si el
# despliegue se recrea, este script sigue apuntando donde toca sin editarlo.
#
# Orden: primero `terraform apply`, luego esto. Al reves no hay bucket donde
# subir ni distribucion que invalidar.
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

# La direccion de la API es RELATIVA: el frontend y la API se sirven bajo el mismo
# origen, asi que no hace falta conocer el dominio para construir. Eso rompe el
# circulo de "necesito el dominio para construir y construir para desplegar".
# MSYS_NO_PATHCONV solo AQUI, y no exportado para todo el script. Git Bash en
# Windows convierte los valores que parecen rutas de Unix antes de pasarlos a un
# programa nativo: "/api/v1" llegaria como "C:/Program Files/Git/api/v1". Pero
# desactivar la conversion para todo el script rompe las llamadas a terraform,
# que si necesitan que su ruta se traduzca a formato Windows.
MSYS_NO_PATHCONV=1 \
VITE_API_BASE_URL="/api/v1" \
VITE_COGNITO_USER_POOL_ID="$USER_POOL_ID" \
VITE_COGNITO_CLIENT_ID="$CLIENT_ID" \
  pnpm --filter @educacion-estrella/web build

DIST="$RAIZ/apps/web/dist"
[ -d "$DIST" ] || { echo "No existe $DIST tras construir." >&2; exit 1; }

echo "Subiendo a s3://$BUCKET…"

# Dos pasadas, y el orden importa.
#
# Primero todo lo que lleva huella en el nombre: el constructor le pone un hash al
# contenido, asi que un archivo con ese nombre nunca cambia y puede cachearse un
# ano. Se sube ANTES que el index para que, cuando el index nuevo empiece a
# servirse, los archivos a los que apunta ya esten ahi.
aws s3 sync "$DIST" "s3://$BUCKET" \
  --delete \
  --exclude "index.html" \
  --cache-control "public, max-age=31536000, immutable"

# Y despues el index, que NO se cachea: es el unico archivo cuyo nombre no cambia
# nunca, asi que cachearlo dejaria a la gente con la version anterior indefinidamente.
aws s3 cp "$DIST/index.html" "s3://$BUCKET/index.html" \
  --cache-control "no-cache, must-revalidate" \
  --content-type "text/html; charset=utf-8"

echo "Invalidando la cache de la distribucion…"
# La misma conversion de rutas de Git Bash muerde aqui: sin esto, la ruta a
# invalidar llega como "C:/Program Files/Git/index.html" y CloudFront la rechaza.
INVALIDACION="$(MSYS_NO_PATHCONV=1 aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUCION" \
  --paths "/index.html" \
  --query 'Invalidation.Id' --output text)"

echo
echo "Publicado: $URL"
echo "Invalidacion en curso: $INVALIDACION"
