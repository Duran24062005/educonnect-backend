#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'EOF'
Uso:
  bash scripts/restore-mongodb.sh <directorio-del-backup> [--drop]

Variables:
  DATABASE_URL o MONGODB_URI  URI de MongoDB destino

El parámetro --drop es opcional y reemplaza documentos existentes.
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" || "$#" == "0" ]]; then
    usage
    [[ "$#" == "0" ]] && exit 1 || exit 0
fi

if ! command -v mongorestore >/dev/null 2>&1; then
    echo "Error: mongorestore no está instalado o no está en PATH." >&2
    echo "Instala MongoDB Database Tools o ejecuta el comando dentro de un contenedor MongoDB compatible." >&2
    exit 1
fi

MONGODB_URI="${MONGODB_URI:-${DATABASE_URL:-}}"
if [[ -z "$MONGODB_URI" ]]; then
    echo "Error: define DATABASE_URL o MONGODB_URI." >&2
    exit 1
fi

SOURCE="$1"
if [[ ! -d "$SOURCE" ]]; then
    echo "Error: el directorio del backup no existe: $SOURCE" >&2
    exit 1
fi

DROP_ARGS=()
if [[ "${2:-}" == "--drop" ]]; then
    DROP_ARGS=(--drop)
elif [[ "${2:-}" != "" ]]; then
    echo "Error: opción no reconocida: ${2}" >&2
    usage
    exit 1
fi

mongorestore \
    --uri "$MONGODB_URI" \
    --gzip \
    "${DROP_ARGS[@]}" \
    "$SOURCE"

printf 'Restauración completada desde %s\n' "$SOURCE"
