#!/usr/bin/env bash

# Tests for scripts/release.sh and scripts/verify-production-source.sh.
#
# They use fake gcloud, docker, curl and gh executables, so they never contact
# Google Cloud or GitHub. Run from anywhere:  bash scripts/tests/run.sh
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RELEASE="$ROOT/scripts/release.sh"
VERIFY="$ROOT/scripts/verify-production-source.sh"

TESTS=0
FAILURES=0
SHA_A="$(printf 'a%.0s' $(seq 1 40))"
DIGEST="sha256:$(printf 'd%.0s' $(seq 1 64))"
REPOSITORY="GreenITESO-Proyecto-Integrador/GreenITESO-Frontend"

fail() {
  FAILURES=$((FAILURES + 1))
  echo "    FAIL: $1"
}

assert_eq() { # expected actual message
  [[ "$1" == "$2" ]] || fail "$3 (expected '$1', got '$2')"
}
assert_contains() { # haystack needle message
  [[ "$1" == *"$2"* ]] || fail "$3 (missing '$2')"
}
assert_not_contains() { # haystack needle message
  [[ "$1" != *"$2"* ]] || fail "$3 (unexpected '$2')"
}
line_of() { # log pattern -> first matching line number, or 0
  local n
  n="$(grep -n -m1 -- "$2" <<<"$1" | cut -d: -f1)"
  echo "${n:-0}"
}
assert_before() { # log first second message
  local a b
  a="$(line_of "$1" "$2")"
  b="$(line_of "$1" "$3")"
  if [[ "$a" -eq 0 || "$b" -eq 0 || "$a" -ge "$b" ]]; then
    fail "$4 ('$2' must come before '$3')"
  fi
}

new_workspace() {
  WORK="$(mktemp -d)"
  BIN="$WORK/bin"
  LOG="$WORK/commands.log"
  mkdir -p "$BIN"
  : >"$LOG"

  cat >"$WORK/service.json" <<'JSON'
{"status":{"traffic":[
  {"percent":100,"latestRevision":false,"revisionName":"old"},
  {"tag":"candidate","url":"https://candidate---greeniteso-production-frontend-x.a.run.app"}
]}}
JSON

  cat >"$BIN/gcloud" <<EOF
#!/bin/sh
echo "gcloud \$*" >> "$LOG"
case "\$*" in
  *"artifacts docker images describe"*) echo "\${FAKE_DIGEST:-$DIGEST}" ;;
  *"run services describe"*) cat "$WORK/service.json" ;;
esac
exit 0
EOF
  cat >"$BIN/docker" <<EOF
#!/bin/sh
echo "docker \$*" >> "$LOG"
exit 0
EOF
  cat >"$BIN/curl" <<EOF
#!/bin/sh
echo "curl \$*" >> "$LOG"
for last in "\$@"; do :; done
case "\$last" in
  */api/*) printf '%s' "\${FAKE_API_CODE:-405}" ;;
  *) printf '%s' "\${FAKE_ROOT_CODE:-200}" ;;
esac
exit 0
EOF
  chmod +x "$BIN/gcloud" "$BIN/docker" "$BIN/curl"
}

# run_release [NAME=VALUE ...]   (later assignments win; RELEASE_ARGS adds arguments)
run_release() {
  env -i PATH="$BIN:$PATH" HOME="$WORK" \
    RELEASE_RECORD_PATH="$WORK/release-record.txt" \
    GCP_PROJECT_ID=greeniteso-510118 GCP_REGION=northamerica-south1 \
    ARTIFACT_REGISTRY_LOCATION=northamerica-south1 ARTIFACT_REGISTRY_REPO=greeniteso \
    CLOUD_RUN_SERVICE=greeniteso-production-frontend RELEASE_SHA="$SHA_A" \
    BACKEND_URL=https://greeniteso-production-backend-1.northamerica-south1.run.app \
    VITE_API_BASE_URL=https://greeniteso-production-frontend-1.northamerica-south1.run.app \
    VITE_MICROSOFT_CLIENT_ID=3cdf3b16-62de-49b2-811e-55babb5412ec \
    VITE_MICROSOFT_AUTHORITY=https://login.microsoftonline.com/organizations \
    "$@" bash "$RELEASE" ${RELEASE_ARGS:-}
}

run_test() {
  TESTS=$((TESTS + 1))
  echo "  $1"
  new_workspace
  "$1"
  rm -rf "$WORK"
}

# --- release.sh -------------------------------------------------------------

test_release_happy_path_moves_traffic_last() {
  local out code log
  out="$(run_release 2>&1)"
  code=$?
  log="$(cat "$LOG")"
  assert_eq 0 "$code" "release succeeds"
  assert_before "$log" "docker build" "docker push" "build before push"
  assert_before "$log" "docker push" "artifacts docker images describe" "push before digest lookup"
  assert_before "$log" "artifacts docker images describe" "run deploy" "digest before deploy"
  assert_before "$log" "run deploy" "curl" "deploy before health checks"
  assert_before "$log" "curl" "--to-latest" "health checks before traffic shift"
  assert_contains "$log" "--no-traffic" "candidate is deployed without traffic"
  assert_contains "$log" "--tag=candidate" "candidate is tagged"
  assert_contains "$log" "--port=8080" "port is set"
  assert_contains "$log" "BACKEND_URL=https://greeniteso-production-backend-1.northamerica-south1.run.app" "backend url is set"
  assert_contains "$log" "BACKEND_HOST=greeniteso-production-backend-1.northamerica-south1.run.app" "backend host drops the scheme"
  assert_contains "$log" "@$DIGEST" "deploys by digest, not by tag"
  assert_contains "$log" "--platform linux/amd64" "builds for Cloud Run's platform"
  assert_contains "$log" "--build-arg VITE_API_BASE_URL=https://greeniteso-production-frontend-1" "api base url is a build arg"
  assert_contains "$log" "--build-arg VITE_MICROSOFT_CLIENT_ID=3cdf3b16-62de-49b2-811e-55babb5412ec" "client id is a build arg"
  assert_contains "$log" ":sha-$SHA_A" "image is tagged with the commit"
  assert_contains "$(cat "$WORK/release-record.txt")" "image_digest=$DIGEST" "release record has the digest"
}

test_release_failed_root_check_never_moves_traffic() {
  local out code log
  out="$(run_release FAKE_ROOT_CODE=500 2>&1)"
  code=$?
  log="$(cat "$LOG")"
  assert_eq 1 "$code" "release fails"
  assert_contains "$out" "leaving traffic on the current revision" "explains that traffic did not move"
  assert_not_contains "$log" "update-traffic" "traffic is not shifted"
  [[ ! -f "$WORK/release-record.txt" ]] || fail "no release record for a failed release"
}

test_release_proxy_to_backend_down_never_moves_traffic() {
  local out code log
  for api in 502 503 000; do
    : >"$LOG"
    out="$(run_release FAKE_API_CODE=$api 2>&1)"
    code=$?
    log="$(cat "$LOG")"
    assert_eq 1 "$code" "release fails when /api answers $api"
    assert_not_contains "$log" "update-traffic" "traffic not shifted when /api answers $api"
  done
}

test_release_accepts_any_backend_answer_below_500() {
  local code
  for api in 200 401 404 405; do
    : >"$LOG"
    run_release FAKE_API_CODE=$api >/dev/null 2>&1
    code=$?
    assert_eq 0 "$code" "release succeeds when /api answers $api"
    assert_contains "$(cat "$LOG")" "--to-latest" "traffic shifts when /api answers $api"
  done
}

test_release_missing_candidate_url_stops_before_traffic() {
  local out code log
  echo '{"status":{"traffic":[{"percent":100}]}}' >"$WORK/service.json"
  out="$(run_release 2>&1)"
  code=$?
  log="$(cat "$LOG")"
  assert_eq 1 "$code" "release fails without a candidate url"
  assert_contains "$out" "Could not find the candidate revision URL" "says why"
  assert_not_contains "$log" "curl" "no health check is attempted"
  assert_not_contains "$log" "update-traffic" "traffic is not shifted"
}

test_release_invalid_registry_digest_stops_before_deploy() {
  local out code log
  out="$(run_release FAKE_DIGEST=not-a-digest 2>&1)"
  code=$?
  log="$(cat "$LOG")"
  assert_eq 1 "$code" "release fails on a bad digest"
  assert_not_contains "$log" "run deploy" "nothing is deployed"
}

test_release_rejects_whitespace_in_any_setting_before_gcloud() {
  local out code name
  for name in GCP_PROJECT_ID CLOUD_RUN_SERVICE ARTIFACT_REGISTRY_REPO BACKEND_URL VITE_MICROSOFT_CLIENT_ID; do
    : >"$LOG"
    out="$(run_release "$name"=$'value\n' 2>&1)"
    code=$?
    assert_eq 2 "$code" "$name with a trailing newline is rejected"
    assert_contains "$out" "$name must not contain spaces or line breaks" "names the offending setting ($name)"
    assert_eq "" "$(cat "$LOG")" "no gcloud/docker call happens for $name"
  done
}

test_release_requires_every_setting() {
  local out code name
  for name in GCP_PROJECT_ID GCP_REGION ARTIFACT_REGISTRY_LOCATION ARTIFACT_REGISTRY_REPO CLOUD_RUN_SERVICE BACKEND_URL VITE_API_BASE_URL VITE_MICROSOFT_CLIENT_ID VITE_MICROSOFT_AUTHORITY; do
    out="$(run_release "$name=" 2>&1)"
    code=$?
    assert_eq 2 "$code" "missing $name is rejected"
    assert_contains "$out" "$name is required" "names the missing setting ($name)"
  done
}

test_release_validates_formats() {
  local out code
  out="$(run_release BACKEND_URL=https://host.example/ 2>&1)"
  code=$?
  assert_eq 2 "$code" "a trailing slash on BACKEND_URL is rejected"
  assert_contains "$out" "https origin with no path or trailing slash" "explains the format"
  out="$(run_release BACKEND_URL=http://host.example 2>&1)"
  assert_eq 2 "$?" "an http backend url is rejected"
  out="$(run_release VITE_API_BASE_URL=https://host.example/app 2>&1)"
  assert_eq 2 "$?" "a path on VITE_API_BASE_URL is rejected"
  out="$(run_release VITE_MICROSOFT_CLIENT_ID=not-a-guid 2>&1)"
  assert_eq 2 "$?" "a non-GUID client id is rejected"
  out="$(run_release RELEASE_SHA=abc123 2>&1)"
  assert_eq 2 "$?" "a short commit sha is rejected"
  out="$(run_release CLOUD_RUN_SERVICE=Bad_Service 2>&1)"
  assert_eq 2 "$?" "an invalid service name is rejected"
}

test_release_check_config_validates_without_touching_the_cloud() {
  local out code
  RELEASE_ARGS="--check-config" out="$(run_release 2>&1)"
  code=$?
  assert_eq 0 "$code" "valid config passes"
  assert_contains "$out" "Release configuration is valid." "says so"
  assert_eq "" "$(cat "$LOG")" "no gcloud/docker call"
  RELEASE_ARGS="--check-config" out="$(run_release GCP_PROJECT_ID=$'a\nb' 2>&1)"
  assert_eq 2 "$?" "invalid config still fails in check-config mode"
}

# --- verify-production-source.sh -------------------------------------------

run_verify() { # response-json [api-status] [sha]
  printf '%s' "$1" >"$WORK/response.json"
  cat >"$BIN/gh" <<EOF
#!/bin/sh
case "\$2" in
  */commits/*/pulls) cat "$WORK/response.json"; exit ${2:-0} ;;
esac
exit 99
EOF
  chmod +x "$BIN/gh"
  env PATH="$BIN:$PATH" GITHUB_REPOSITORY="$REPOSITORY" RELEASE_SHA="${3:-$SHA_A}" bash "$VERIFY"
}

promotion_pr() { # overrides applied by python
  python3 - "$@" <<'PY'
import json
import sys

sha = "a" * 40
repo = "GreenITESO-Proyecto-Integrador/GreenITESO-Frontend"
pull = {
    "number": 7,
    "merged_at": "2026-11-05T14:35:08Z",
    "merge_commit_sha": sha,
    "base": {"ref": "prod"},
    "head": {"ref": "preprod", "repo": {"full_name": repo}},
}
for override in sys.argv[1:]:
    key, _, value = override.partition("=")
    pull[key] = json.loads(value)
print(json.dumps([pull]))
PY
}

test_verify_accepts_a_merged_preprod_promotion() {
  local out
  out="$(run_verify "$(promotion_pr)" 2>&1)"
  assert_eq 0 "$?" "accepted"
  assert_contains "$out" "Verified promotion PR #7" "says which PR"
}

test_verify_rejects_everything_but_a_preprod_promotion() {
  local label override
  for pair in \
    'not-merged|merged_at=null' \
    'other-merge-commit|merge_commit_sha="eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"' \
    'wrong-base|base={"ref":"preprod"}' \
    'not-from-preprod|head={"ref":"dev","repo":{"full_name":"GreenITESO-Proyecto-Integrador/GreenITESO-Frontend"}}' \
    'fork|head={"ref":"preprod","repo":{"full_name":"attacker/GreenITESO-Frontend"}}' \
    'deleted-fork|head={"ref":"preprod","repo":null}'; do
    label="${pair%%|*}"
    override="${pair#*|}"
    run_verify "$(promotion_pr "$override")" >/dev/null 2>"$WORK/err"
    assert_eq 1 "$?" "$label is rejected"
    assert_contains "$(cat "$WORK/err")" "refusing production release" "$label explains itself"
  done
}

test_verify_rejects_a_commit_without_a_pull_request() {
  run_verify "[]" >/dev/null 2>&1
  assert_eq 1 "$?" "no pull request is rejected"
}

test_verify_fails_closed_on_api_or_shape_errors() {
  run_verify "[]" 1 >/dev/null 2>&1
  assert_eq 1 "$?" "an API failure is rejected"
  run_verify "<html>" 0 >/dev/null 2>&1
  assert_eq 1 "$?" "a non-JSON answer is rejected"
  run_verify '{"pulls":[]}' 0 >/dev/null 2>&1
  assert_eq 1 "$?" "a non-list answer is rejected"
}

test_verify_rejects_a_malformed_sha() {
  run_verify "[]" 0 abc >/dev/null 2>&1
  assert_eq 2 "$?" "a short sha is rejected with the usage code"
}

echo "scripts/release.sh"
for t in \
  test_release_happy_path_moves_traffic_last \
  test_release_failed_root_check_never_moves_traffic \
  test_release_proxy_to_backend_down_never_moves_traffic \
  test_release_accepts_any_backend_answer_below_500 \
  test_release_missing_candidate_url_stops_before_traffic \
  test_release_invalid_registry_digest_stops_before_deploy \
  test_release_rejects_whitespace_in_any_setting_before_gcloud \
  test_release_requires_every_setting \
  test_release_validates_formats \
  test_release_check_config_validates_without_touching_the_cloud; do
  run_test "$t"
done
echo "scripts/verify-production-source.sh"
for t in \
  test_verify_accepts_a_merged_preprod_promotion \
  test_verify_rejects_everything_but_a_preprod_promotion \
  test_verify_rejects_a_commit_without_a_pull_request \
  test_verify_fails_closed_on_api_or_shape_errors \
  test_verify_rejects_a_malformed_sha; do
  run_test "$t"
done

echo
if [[ "$FAILURES" -eq 0 ]]; then
  echo "All $TESTS tests passed."
else
  echo "$FAILURES check(s) failed across $TESTS tests."
  exit 1
fi
