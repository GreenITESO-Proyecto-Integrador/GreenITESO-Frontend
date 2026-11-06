#!/usr/bin/env bash

# Build the Frontend image, deploy it to Cloud Run as a no-traffic candidate,
# health-check that candidate, and only then shift traffic to it.
#
# A failed build, a failed deploy or a failed health check leaves the current
# revision serving, because traffic moves in the very last step.
#
# `--check-config` validates the settings and exits; the workflow runs it before
# logging in to Google Cloud so a bad GitHub secret fails with its name.
set -euo pipefail

required() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "${name} is required (check the '${RELEASE_ENVIRONMENT:-production}' GitHub Environment secrets)" >&2
    exit 2
  fi
}

CONFIG_VARIABLES=(
  GCP_PROJECT_ID GCP_REGION ARTIFACT_REGISTRY_LOCATION ARTIFACT_REGISTRY_REPO
  CLOUD_RUN_SERVICE RELEASE_SHA BACKEND_URL VITE_API_BASE_URL
  VITE_MICROSOFT_CLIENT_ID VITE_MICROSOFT_AUTHORITY
)

for variable in "${CONFIG_VARIABLES[@]}"; do
  required "$variable"
done

# A secret pasted through the GitHub web form can carry a trailing line break,
# which broke the Backend's first release. Reject any whitespace in any value.
for variable in "${CONFIG_VARIABLES[@]}"; do
  if [[ "${!variable}" =~ [[:space:]] ]]; then
    echo "${variable} must not contain spaces or line breaks; re-enter that GitHub secret without a trailing newline" >&2
    exit 2
  fi
done

if [[ ! "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "RELEASE_SHA must be a full 40-character commit SHA" >&2
  exit 2
fi
if [[ ! "$CLOUD_RUN_SERVICE" =~ ^[a-z]([a-z0-9-]*[a-z0-9])?$ ]]; then
  echo "CLOUD_RUN_SERVICE must be a lowercase Cloud Run service name" >&2
  exit 2
fi
# nginx proxies to ${BACKEND_URL}; a path or trailing slash would change what
# /api/ and /ws/ resolve to.
for variable in BACKEND_URL VITE_API_BASE_URL; do
  if [[ ! "${!variable}" =~ ^https://[A-Za-z0-9.-]+$ ]]; then
    echo "${variable} must be an https origin with no path or trailing slash (https://host)" >&2
    exit 2
  fi
done
if [[ ! "$VITE_MICROSOFT_CLIENT_ID" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]; then
  echo "VITE_MICROSOFT_CLIENT_ID must be a GUID" >&2
  exit 2
fi
if [[ ! "$VITE_MICROSOFT_AUTHORITY" =~ ^https://[A-Za-z0-9./_-]+$ ]]; then
  echo "VITE_MICROSOFT_AUTHORITY must be an https URL" >&2
  exit 2
fi

if [[ "${1:-}" == "--check-config" ]]; then
  echo "Release configuration is valid."
  exit 0
fi

BACKEND_HOST="${BACKEND_URL#https://}"
IMAGE_REGISTRY="${ARTIFACT_REGISTRY_LOCATION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}"
IMAGE="${IMAGE_REGISTRY}/frontend"
IMAGE_BY_TAG="${IMAGE}:sha-${RELEASE_SHA}"

gcloud auth configure-docker "${ARTIFACT_REGISTRY_LOCATION}-docker.pkg.dev" --quiet

# The VITE_* values are compiled into the JavaScript bundle, so they are build
# arguments, not runtime settings.
docker build \
  --platform linux/amd64 \
  --target runtime \
  --tag "$IMAGE_BY_TAG" \
  --build-arg "VITE_API_BASE_URL=${VITE_API_BASE_URL}" \
  --build-arg "VITE_MICROSOFT_CLIENT_ID=${VITE_MICROSOFT_CLIENT_ID}" \
  --build-arg "VITE_MICROSOFT_AUTHORITY=${VITE_MICROSOFT_AUTHORITY}" \
  --file Dockerfile .
docker push "$IMAGE_BY_TAG"

IMAGE_DIGEST="$(gcloud artifacts docker images describe "$IMAGE_BY_TAG" \
  --project="$GCP_PROJECT_ID" \
  --format='value(image_summary.digest)' | tr -d '[:space:]')"
if [[ ! "$IMAGE_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]]; then
  echo "Artifact Registry did not return a valid digest for ${IMAGE_BY_TAG}" >&2
  exit 1
fi
IMAGE_BY_DIGEST="${IMAGE}@${IMAGE_DIGEST}"

# --no-traffic keeps the current revision serving while the candidate starts.
gcloud run deploy "$CLOUD_RUN_SERVICE" \
  --image="$IMAGE_BY_DIGEST" \
  --region="$GCP_REGION" \
  --project="$GCP_PROJECT_ID" \
  --port=8080 \
  --set-env-vars="BACKEND_URL=${BACKEND_URL},BACKEND_HOST=${BACKEND_HOST}" \
  --no-traffic \
  --tag=candidate \
  --quiet

CANDIDATE_URL="$(gcloud run services describe "$CLOUD_RUN_SERVICE" \
  --region="$GCP_REGION" \
  --project="$GCP_PROJECT_ID" \
  --format=json | python3 -c '
import json
import sys

service = json.load(sys.stdin)
for entry in service.get("status", {}).get("traffic", []):
    if entry.get("tag") == "candidate" and entry.get("url"):
        print(entry["url"])
        break
')"
if [[ ! "$CANDIDATE_URL" =~ ^https://[A-Za-z0-9.-]+$ ]]; then
  echo "Could not find the candidate revision URL; leaving traffic on the current revision" >&2
  exit 1
fi

http_code() {
  curl -sS -o /dev/null -w '%{http_code}' --max-time 30 \
    --retry 5 --retry-delay 4 --retry-all-errors "$1" || echo "000"
}

root_code="$(http_code "${CANDIDATE_URL}/")"
if [[ "$root_code" != "200" ]]; then
  echo "Candidate returned HTTP ${root_code} for /; leaving traffic on the current revision" >&2
  exit 1
fi
# This goes through nginx to the Backend. Any answer below 500 means the proxy
# reached Django (a GET on the login route is a 405); 5xx or no answer means
# BACKEND_URL is wrong or the Backend is down.
api_code="$(http_code "${CANDIDATE_URL}/api/v1/auth/login/")"
if [[ ! "$api_code" =~ ^[1-4][0-9][0-9]$ ]]; then
  echo "Candidate returned HTTP ${api_code} through the /api proxy; leaving traffic on the current revision" >&2
  exit 1
fi

gcloud run services update-traffic "$CLOUD_RUN_SERVICE" \
  --to-latest \
  --region="$GCP_REGION" \
  --project="$GCP_PROJECT_ID" \
  --quiet
gcloud run services update-traffic "$CLOUD_RUN_SERVICE" \
  --remove-tags=candidate \
  --region="$GCP_REGION" \
  --project="$GCP_PROJECT_ID" \
  --quiet || true

RELEASE_RECORD_PATH="${RELEASE_RECORD_PATH:-release-record.txt}"
cat > "$RELEASE_RECORD_PATH" <<EOF
environment=production
release_sha=${RELEASE_SHA}
image=${IMAGE}
image_digest=${IMAGE_DIGEST}
EOF
echo "Released ${IMAGE_BY_DIGEST} to ${CLOUD_RUN_SERVICE}"
