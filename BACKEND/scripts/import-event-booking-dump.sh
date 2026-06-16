#!/usr/bin/env bash

set -euo pipefail

# One-time restore script for BACKEND/event_booking dump.
# Runs mongorestore via the official mongo Docker image.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_DUMP_DIR="${SCRIPT_DIR}/../event_booking"

MONGO_IMAGE="${MONGO_IMAGE:-mongo:7}"
DUMP_DIR="${DUMP_DIR:-$DEFAULT_DUMP_DIR}"
MONGODB_URI="${MONGODB_URI:-${DATABASE_URL:-}}"
TARGET_DB="${TARGET_DB:-event_booking}"
DROP_EXISTING="${DROP_EXISTING:-false}"
NON_INTERACTIVE="${NON_INTERACTIVE:-false}"

if [[ -z "${MONGODB_URI}" ]]; then
  echo "Error: MONGODB_URI (or DATABASE_URL) is required."
  echo "Example:"
  echo "  MONGODB_URI='mongodb+srv://user:pass@cluster.mongodb.net' TARGET_DB='event_booking' ./scripts/import-event-booking-dump.sh"
  exit 1
fi

if [[ ! -d "${DUMP_DIR}" ]]; then
  echo "Error: dump directory not found: ${DUMP_DIR}"
  exit 1
fi

if [[ "${NON_INTERACTIVE}" != "true" ]]; then
  echo "This will import dump into MongoDB."
  echo "  Dump directory : ${DUMP_DIR}"
  echo "  Target database: ${TARGET_DB}"
  echo "  Drop existing  : ${DROP_EXISTING}"
  read -r -p "Type YES to continue: " CONFIRM
  if [[ "${CONFIRM}" != "YES" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

DROP_FLAG=""
if [[ "${DROP_EXISTING}" == "true" ]]; then
  DROP_FLAG="--drop"
fi

echo "Running mongorestore with image ${MONGO_IMAGE}..."
docker run --rm \
  -v "${DUMP_DIR}:/dump:ro" \
  "${MONGO_IMAGE}" \
  mongorestore \
    --uri="${MONGODB_URI}" \
    --db="${TARGET_DB}" \
    ${DROP_FLAG} \
    --numInsertionWorkersPerCollection=4 \
    --stopOnError \
    /dump

echo "Restore completed."
