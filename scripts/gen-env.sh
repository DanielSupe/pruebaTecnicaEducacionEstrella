#!/usr/bin/env bash
#
# Generates the api and web env files from the Terraform outputs.
#
# No infrastructure identifier is ever transcribed by hand into the code: Terraform
# is the single source of truth for these values.
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

# Not from Terraform because it is not an infrastructure identifier but a local
# configuration choice; the production value is injected by the deployment.
WEB_DEV_ORIGIN="${WEB_DEV_ORIGIN:-http://localhost:5173}"

# Locally this points at the dev server; the deployment replaces it.
API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api/v1}"

# The API variables carry no prefix: they never leave the server.
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

# The frontend ones carry the VITE_ prefix because Vite only exposes those to the
# browser. None of these values is secret.
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
