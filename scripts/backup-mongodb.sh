#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'EOF'
Uso:
  bash scripts/backup-mongodb.sh [directorio-de-salida]

Variables:
  DATABASE_URL o MONGODB_URI  URI de MongoDB con permisos de lectura

El backup se crea en un directorio fechado y comprimido con mongodump.
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    usage
    exit 0
fi

if ! command -v mongodump >/dev/null 2>&1; then
    echo "Error: mongodump no está instalado o no está en PATH." >&2
    echo "Instala MongoDB Database Tools o ejecuta el comando dentro de un contenedor MongoDB compatible." >&2
    exit 1
fi

MONGODB_URI="${MONGODB_URI:-${DATABASE_URL:-}}"
if [[ -z "$MONGODB_URI" ]]; then
    echo "Error: define DATABASE_URL o MONGODB_URI." >&2
    exit 1
fi

OUTPUT_ROOT="${1:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="${OUTPUT_ROOT%/}/educonnect-${STAMP}"

umask 077
mkdir -p "$TARGET"

mongodump \
    --uri "$MONGODB_URI" \
    --gzip \
    --out "$TARGET"

printf 'Backup creado en %s\n' "$TARGET"
