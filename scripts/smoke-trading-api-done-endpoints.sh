#!/usr/bin/env bash

set -u
set -o pipefail

BASE_URL="${BASE_URL:-https://apisix.gridtokenx-coresystem.orb.local}"
AUTH_BASE_URL="${AUTH_BASE_URL:-}"
TOKEN="${TOKEN:-${AUTH_TOKEN:-}}"
TIMEOUT="${TIMEOUT:-20}"
SHOW_BODY="${SHOW_BODY:-0}"
CURL_INSECURE="${CURL_INSECURE:-0}"
REGISTER="${REGISTER:-0}"
REGISTER_USERNAME="${REGISTER_USERNAME:-}"
REGISTER_EMAIL="${REGISTER_EMAIL:-}"
REGISTER_PASSWORD="${REGISTER_PASSWORD:-TestPass123!}"
REGISTER_FIRST_NAME="${REGISTER_FIRST_NAME:-Smoke}"
REGISTER_LAST_NAME="${REGISTER_LAST_NAME:-Tester}"

usage() {
  cat <<'EOF'
Smoke test completed trading API GET endpoints.

Usage:
  scripts/smoke-trading-api-done-endpoints.sh [base_url]

Environment:
  BASE_URL        API base URL. Default: https://apisix.gridtokenx-coresystem.orb.local
  AUTH_BASE_URL   Optional auth API base URL for REGISTER=1. Defaults to BASE_URL.
  TOKEN           Optional bearer token for protected endpoints.
  AUTH_TOKEN      Alternative token env var if TOKEN is not set.
  REGISTER=1      Register and verify a fresh test user, then use its JWT.
  REGISTER_USERNAME
                  Optional username for REGISTER=1. Defaults to smoke_<timestamp>.
  REGISTER_EMAIL  Optional email for REGISTER=1. Defaults to <username>@test.com.
  REGISTER_PASSWORD
                  Password for REGISTER=1. Default: TestPass123!
  TIMEOUT         curl max time in seconds. Default: 20
  SHOW_BODY=1     Print response bodies for successful requests.
  CURL_INSECURE=1 Pass -k to curl for local/self-signed TLS.

Examples:
  scripts/smoke-trading-api-done-endpoints.sh
  BASE_URL=http://localhost:8093 scripts/smoke-trading-api-done-endpoints.sh
  TOKEN="$JWT" CURL_INSECURE=1 scripts/smoke-trading-api-done-endpoints.sh
  BASE_URL=http://apisix.gridtokenx-coresystem.orb.local REGISTER=1 scripts/smoke-trading-api-done-endpoints.sh
  AUTH_BASE_URL=http://localhost:4010 BASE_URL=http://apisix.gridtokenx-coresystem.orb.local REGISTER=1 scripts/smoke-trading-api-done-endpoints.sh
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ -n "${1:-}" ]]; then
  BASE_URL="$1"
fi

BASE_URL="${BASE_URL%/}"
if [[ -z "$AUTH_BASE_URL" ]]; then
  AUTH_BASE_URL="$BASE_URL"
else
  AUTH_BASE_URL="${AUTH_BASE_URL%/}"
fi

curl_args=(
  --silent
  --show-error
  --location
  --max-time "$TIMEOUT"
  --connect-timeout 10
)

if [[ "$CURL_INSECURE" == "1" ]]; then
  curl_args+=("--insecure")
fi

extract_access_token() {
  grep -o '"access_token"[[:space:]]*:[[:space:]]*"[^"]*"' "$1" \
    | head -1 \
    | sed 's/.*"access_token"[[:space:]]*:[[:space:]]*"//; s/".*//'
}

run_json_request() {
  local method="$1"
  local path="$2"
  local body="$3"
  local output_file="$4"

  curl "${curl_args[@]}" \
    --request "$method" \
    --header "Content-Type: application/json" \
    --output "$output_file" \
    --write-out '%{http_code}' \
    --data "$body" \
    "${AUTH_BASE_URL}${path}"
}

if [[ "$REGISTER" == "1" && -z "$TOKEN" ]]; then
  ts="$(date +%s)"
  if [[ -z "$REGISTER_USERNAME" ]]; then
    REGISTER_USERNAME="smoke_${ts}_$((RANDOM % 10000))"
  fi
  if [[ -z "$REGISTER_EMAIL" ]]; then
    REGISTER_EMAIL="${REGISTER_USERNAME}@test.com"
  fi

  register_body_file="$(mktemp)"
  verify_body_file="$(mktemp)"
  login_body_file="$(mktemp)"

  printf 'Register: %s <%s> ... ' "$REGISTER_USERNAME" "$REGISTER_EMAIL"
  register_payload="$(printf '{"username":"%s","email":"%s","password":"%s","first_name":"%s","last_name":"%s"}' \
    "$REGISTER_USERNAME" \
    "$REGISTER_EMAIL" \
    "$REGISTER_PASSWORD" \
    "$REGISTER_FIRST_NAME" \
    "$REGISTER_LAST_NAME")"

  register_status="$(run_json_request "POST" "/api/v1/auth/register" "$register_payload" "$register_body_file")"
  register_exit=$?

  if [[ $register_exit -ne 0 ]]; then
    printf 'FAIL curl_exit=%s\n' "$register_exit"
    sed -n '1,80p' "$register_body_file"
    rm -f "$register_body_file" "$verify_body_file" "$login_body_file"
    exit 1
  fi

  if [[ "$register_status" =~ ^2[0-9][0-9]$ ]]; then
    printf 'OK status=%s\n' "$register_status"
  elif [[ "$register_status" == "409" ]]; then
    printf 'EXISTS status=409\n'
  else
    printf 'FAIL status=%s\n' "$register_status"
    sed -n '1,80p' "$register_body_file"
    rm -f "$register_body_file" "$verify_body_file" "$login_body_file"
    exit 1
  fi

  printf 'Verify: %s ... ' "$REGISTER_EMAIL"
  verify_status="$(
    curl "${curl_args[@]}" \
      --request "GET" \
      --output "$verify_body_file" \
      --write-out '%{http_code}' \
      "${AUTH_BASE_URL}/api/v1/auth/verify?token=verify_${REGISTER_EMAIL}"
  )"
  verify_exit=$?

  if [[ $verify_exit -ne 0 ]]; then
    printf 'FAIL curl_exit=%s\n' "$verify_exit"
    sed -n '1,80p' "$verify_body_file"
    rm -f "$register_body_file" "$verify_body_file" "$login_body_file"
    exit 1
  fi

  if [[ "$verify_status" =~ ^2[0-9][0-9]$ ]]; then
    TOKEN="$(extract_access_token "$verify_body_file")"
    printf 'OK status=%s\n' "$verify_status"
  else
    printf 'FAIL status=%s\n' "$verify_status"
    sed -n '1,80p' "$verify_body_file"
    rm -f "$register_body_file" "$verify_body_file" "$login_body_file"
    exit 1
  fi

  if [[ -z "$TOKEN" ]]; then
    printf 'Login: %s ... ' "$REGISTER_USERNAME"
    login_payload="$(printf '{"username":"%s","password":"%s"}' "$REGISTER_USERNAME" "$REGISTER_PASSWORD")"
    login_status="$(run_json_request "POST" "/api/v1/auth/login" "$login_payload" "$login_body_file")"
    login_exit=$?

    if [[ $login_exit -ne 0 ]]; then
      printf 'FAIL curl_exit=%s\n' "$login_exit"
      sed -n '1,80p' "$login_body_file"
      rm -f "$register_body_file" "$verify_body_file" "$login_body_file"
      exit 1
    fi

    if [[ "$login_status" =~ ^2[0-9][0-9]$ ]]; then
      TOKEN="$(extract_access_token "$login_body_file")"
      printf 'OK status=%s\n' "$login_status"
    else
      printf 'FAIL status=%s\n' "$login_status"
      sed -n '1,80p' "$login_body_file"
      rm -f "$register_body_file" "$verify_body_file" "$login_body_file"
      exit 1
    fi
  fi

  rm -f "$register_body_file" "$verify_body_file" "$login_body_file"

  if [[ -z "$TOKEN" ]]; then
    printf 'Could not extract access_token from verify/login response.\n'
    exit 1
  fi
fi

if [[ -n "$TOKEN" ]]; then
  curl_args+=("--header" "Authorization: Bearer $TOKEN")
fi

endpoints=(
  "GET /api/v1/markets/config"
  "GET /api/v1/markets/p2p/market-prices"
  "GET /api/v1/markets/matching-status"
  "GET /api/v1/markets/settlement-stats"
  "GET /api/v1/markets/orderbook"
  "GET /api/v1/trades"
  "GET /api/v1/trades/export"
)

total=0
passed=0
failed=0

printf 'Base URL: %s\n' "$BASE_URL"
if [[ "$REGISTER" == "1" ]]; then
  printf 'Auth URL: %s\n' "$AUTH_BASE_URL"
fi
if [[ -z "$TOKEN" ]]; then
  printf 'Auth: none (set TOKEN or AUTH_TOKEN if protected endpoints return 401/403)\n'
else
  printf 'Auth: bearer token configured\n'
fi
printf '\n'

for entry in "${endpoints[@]}"; do
  method="${entry%% *}"
  path="${entry#* }"
  url="${BASE_URL}${path}"
  body_file="$(mktemp)"

  total=$((total + 1))
  printf '[%s] %s ... ' "$method" "$path"

  http_status="$(
    curl "${curl_args[@]}" \
      --request "$method" \
      --output "$body_file" \
      --write-out '%{http_code}' \
      "$url"
  )"
  curl_exit=$?

  if [[ $curl_exit -ne 0 ]]; then
    failed=$((failed + 1))
    printf 'FAIL curl_exit=%s\n' "$curl_exit"
    if [[ -s "$body_file" ]]; then
      sed -n '1,40p' "$body_file"
    fi
    rm -f "$body_file"
    continue
  fi

  if [[ "$http_status" =~ ^2[0-9][0-9]$ ]]; then
    passed=$((passed + 1))
    printf 'OK status=%s\n' "$http_status"
    if [[ "$SHOW_BODY" == "1" ]]; then
      sed -n '1,40p' "$body_file"
      printf '\n'
    fi
  else
    failed=$((failed + 1))
    printf 'FAIL status=%s\n' "$http_status"
    sed -n '1,80p' "$body_file"
    printf '\n'
  fi

  rm -f "$body_file"
done

printf '\nSummary: %s passed, %s failed, %s total\n' "$passed" "$failed" "$total"

if [[ "$failed" -gt 0 ]]; then
  exit 1
fi
