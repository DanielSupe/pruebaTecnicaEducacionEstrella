#!/usr/bin/env bash
#
# Genera los archivos de entorno de api y web a partir de las salidas de Terraform.
#
# Existe para cumplir una regla de CLAUDE.md: ningun identificador de
# infraestructura se transcribe a mano al codigo. Terraform es la unica fuente de
# verdad de estos valores.
#
# Uso: bash scripts/gen-env.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="$REPO_ROOT/infra"

if [ ! -f "$INFRA_DIR/terraform.tfstate" ]; then
  echo "No hay estado de Terraform en $INFRA_DIR." >&2
  echo "Ejecuta 'terraform apply' dentro de infra/ antes de generar los .env." >&2
  exit 1
fi

echo "Leyendo salidas de Terraform..."
OUTPUTS="$(cd "$INFRA_DIR" && terraform output -json)"

value() {
  printf '%s' "$OUTPUTS" | node -e '
    let raw = "";
    process.stdin.on("data", (c) => (raw += c));
    process.stdin.on("end", () => {
      const outputs = JSON.parse(raw);
      const key = process.argv[1];
      if (!(key in outputs)) {
        console.error(`Falta la salida "${key}" en terraform output.`);
        process.exit(1);
      }
      process.stdout.write(String(outputs[key].value));
    });
  ' "$1"
}

AWS_REGION="$(value aws_region)"
TABLE_NAME="$(value dynamodb_table_name)"
BUCKET_NAME="$(value videos_bucket_name)"
USER_POOL_ID="$(value cognito_user_pool_id)"
CLIENT_ID="$(value cognito_user_pool_client_id)"

# Origenes del frontend en desarrollo. No sale de Terraform porque no es un
# identificador de infraestructura, sino una decision de configuracion local; el
# valor de produccion lo inyecta el despliegue.
WEB_DEV_ORIGIN="${WEB_DEV_ORIGIN:-http://localhost:5173}"

# Direccion de la API para el frontend. En local apunta al servidor de desarrollo;
# el change de despliegue la sustituye por la de API Gateway.
API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api/v1}"

# Las variables de la API no llevan prefijo: nunca salen del servidor.
cat > "$REPO_ROOT/apps/api/.env" <<EOF
# Generado por scripts/gen-env.sh a partir de las salidas de Terraform.
# No lo edites a mano: se regenera. No se versiona.
AWS_REGION=$AWS_REGION
APPLICATIONS_TABLE_NAME=$TABLE_NAME
VIDEOS_BUCKET_NAME=$BUCKET_NAME
COGNITO_USER_POOL_ID=$USER_POOL_ID
COGNITO_CLIENT_ID=$CLIENT_ID
CORS_ALLOWED_ORIGINS=$WEB_DEV_ORIGIN
EOF

# Las del frontend llevan prefijo VITE_ porque Vite solo expone al navegador las
# que lo tienen. Ninguno de estos valores es secreto: son identificadores publicos.
cat > "$REPO_ROOT/apps/web/.env" <<EOF
# Generado por scripts/gen-env.sh a partir de las salidas de Terraform.
# No lo edites a mano: se regenera. No se versiona.
VITE_API_BASE_URL=$API_BASE_URL
VITE_AWS_REGION=$AWS_REGION
VITE_COGNITO_USER_POOL_ID=$USER_POOL_ID
VITE_COGNITO_CLIENT_ID=$CLIENT_ID
EOF

echo "Escritos:"
echo "  apps/api/.env"
echo "  apps/web/.env"
echo
echo "Ambos estan cubiertos por .gitignore."
