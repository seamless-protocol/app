#!/usr/bin/env bash
set -euo pipefail

# Load defaults from tests/integration/.env if not provided in the shell
if [[ -z "${ANVIL_BASE_FORK_URL:-}" || -z "${ANVIL_PORT:-}" || -z "${ANVIL_FORK_BLOCK:-}" ]]; then
  if [[ -f "./tests/integration/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source ./tests/integration/.env
    set +a
  fi
fi

# Defaults if still unset
: "${ANVIL_BASE_FORK_URL:=https://mainnet.base.org}"
: "${ANVIL_PORT:=8545}"

ARGS=(
  --fork-url "${ANVIL_BASE_FORK_URL}"
  --port "${ANVIL_PORT}"
  --chain-id 8453
  --block-time 1
  --no-rate-limit
)

if [[ -n "${ANVIL_FORK_BLOCK:-}" ]]; then
  ARGS+=(--fork-block-number "${ANVIL_FORK_BLOCK}")
fi

exec anvil "${ARGS[@]}"
