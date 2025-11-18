#!/usr/bin/env bash
set -euo pipefail

# Load defaults from .env files if not provided in the shell
# Priority: .env.local > .env > tests/integration/.env
if [[ -z "${ANVIL_MAINNET_FORK_URL:-}" || -z "${ANVIL_PORT:-}" || -z "${ANVIL_MAINNET_FORK_BLOCK:-}" ]]; then
  if [[ -f "./.env.local" ]]; then
    set -a
    # shellcheck disable=SC1091
    source ./.env.local
    set +a
  fi
  if [[ -f "./.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source ./.env
    set +a
  fi
  if [[ -f "./tests/integration/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source ./tests/integration/.env
    set +a
  fi
fi

# Defaults if still unset
if [[ -z "${ANVIL_MAINNET_FORK_URL:-}" ]]; then
  if [[ -z "${VITE_ALCHEMY_API_KEY:-}" ]]; then
    echo "Error: VITE_ALCHEMY_API_KEY must be set or ANVIL_MAINNET_FORK_URL must be provided" >&2
    exit 1
  fi
  ANVIL_MAINNET_FORK_URL="https://eth-mainnet.g.alchemy.com/v2/${VITE_ALCHEMY_API_KEY}"
fi
: "${ANVIL_PORT:=8545}"

ARGS=(
  --fork-url "${ANVIL_MAINNET_FORK_URL}"
  --port "${ANVIL_PORT}"
  --chain-id 1
  --no-rate-limit
)

if [[ -n "${ANVIL_MAINNET_FORK_BLOCK:-}" ]]; then
  ARGS+=(--fork-block-number "${ANVIL_MAINNET_FORK_BLOCK}")
fi

exec anvil "${ARGS[@]}"

