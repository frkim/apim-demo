# ADR-0004: Use a service principal secret fallback with an automatic OIDC path

- Status: Accepted
- Date: 2026-10-03

## Context

The deployment workflow needs to authenticate to Azure from GitHub Actions.
The security standard prefers workload identity federation with OIDC and no stored Azure credentials.
During setup, OIDC federation could not be created because the provided identities lacked the Microsoft Graph rights required to create the federated credential.

## Decision

Support both authentication paths in `.github/workflows/deploy.yml` and `.github/workflows/destroy.yml`.
When repository variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID` exist, the workflow uses OIDC.
When those variables are absent, the workflow uses the `AZURE_CREDENTIALS` secret as a service principal fallback.

## Consequences

The demo can deploy immediately with the provided credentials while preserving a no-code-change migration path to OIDC.
The service principal secret must be treated as temporary, least-privileged, protected by the `azure-demo` environment, and rotated regularly.
Creating the federated credential remains the preferred follow-up once an identity with the required Microsoft Graph rights is available.

## Alternatives considered

- **Require OIDC only**: rejected because it would block the demo with the current identity permissions.
- **Use only `AZURE_CREDENTIALS`**: rejected because it would normalize a secret-based path and hide the intended OIDC migration.
- **Manual local deployment only**: rejected because the repository needs repeatable CI/CD for presenters and reviewers.
