#!/usr/bin/env bash
# One-shot RDS setup: create the database (if missing), run migrations, optional seed.
# Run from the backend/ directory on the EC2 instance after filling in .env.
#
#   chmod +x scripts/setup-rds.sh
#   ./scripts/setup-rds.sh          # create db + migrate
#   ./scripts/setup-rds.sh --seed   # create db + migrate + seed
#
# Pure Node (uses the project's postgres driver) — no system psql client required.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found in $(pwd). Create it from .env.example first." >&2
  exit 1
fi
if grep -q "REPLACE_WITH_RDS_ENDPOINT" .env; then
  echo "ERROR: replace REPLACE_WITH_RDS_ENDPOINT in .env with your real RDS endpoint." >&2
  exit 1
fi

echo "==> Ensuring the database exists on RDS..."
pnpm db:create

echo "==> Running migrations..."
pnpm db:migrate

if [[ "${1:-}" == "--seed" ]]; then
  echo "==> Seeding..."
  pnpm db:seed
fi

echo "==> Done. Build & start with: pnpm build && pnpm start"
