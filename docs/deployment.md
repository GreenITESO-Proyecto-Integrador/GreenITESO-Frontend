# Production deployment

The Frontend releases itself. A push to `prod` (which only happens through a merged
`preprod` to `prod` pull request) runs `.github/workflows/deploy-production.yml`.

## What it does

1. **`verify-source`** asks GitHub whether the pushed commit is the merge commit of a
   merged, same-repository `preprod` to `prod` pull request
   (`scripts/verify-production-source.sh`). It fails closed on any doubt.
2. **`release`** (in the `production` GitHub Environment):
   - rejects a stale release if `prod` has moved on;
   - validates every setting with `scripts/release.sh --check-config` **before** logging
     in to Google Cloud, so a bad secret fails with its name;
   - builds the image on the runner, pushes it, resolves its digest;
   - deploys it as a **no-traffic candidate** (`--no-traffic --tag=candidate`);
   - health-checks the candidate: `/` must answer 200, and `/api/v1/auth/login/` must
     answer below 500 (that request goes through nginx to the Backend, so it also
     catches a wrong `BACKEND_URL`);
   - only then shifts traffic with `--to-latest`.

A failed build, deploy or health check leaves the current revision serving.

## Why it runs on `push`, not on pull-request close

GitHub matches an Environment's deployment-branch rule against the run's ref. A
`pull_request` run uses `refs/pull/<n>/merge`, which a `prod`-only rule rejects (this
is exactly how the Backend's first release failed). A push to `prod` runs on
`refs/heads/prod`.

## Switch and settings

The release is off until the repository variable `CLOUD_PRODUCTION_DEPLOY_ENABLED` is
`true`. The `production` Environment (deployment branch: `prod`) needs these secrets:

| Secret                           | Meaning                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `GCP_PROJECT_ID`, `GCP_REGION`   | Google Cloud project and region                          |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity provider (same value as the Backend's) |
| `GCP_SERVICE_ACCOUNT`            | The Frontend deployer (Infra output)                     |
| `ARTIFACT_REGISTRY_LOCATION`     | Registry region                                          |
| `ARTIFACT_REGISTRY_REPO`         | Registry repository                                      |
| `CLOUD_RUN_SERVICE`              | Cloud Run service to update                              |
| `BACKEND_URL`                    | `https://<backend host>`: no path, no trailing slash     |
| `VITE_API_BASE_URL`              | This site's own public origin (compiled into the bundle) |
| `VITE_MICROSOFT_CLIENT_ID`       | Entra application (client) ID (compiled into the bundle) |
| `VITE_MICROSOFT_AUTHORITY`       | Entra authority URL (compiled into the bundle)           |

Set secrets from the command line, not the web form: the form can add a trailing line
break, which `release.sh` rejects.

The matching Google Cloud identity lives in the Infra repo
(`enable_frontend_release_pipeline`). The tests for these scripts are in
`scripts/tests/run.sh` and run in CI (`pipeline-tests.yml`).
