# Security policy

## Reporting a vulnerability

Use GitHub private vulnerability reporting for this repository.
Do not open a public issue for suspected vulnerabilities or leaked credentials.

Include:

- A concise description of the issue.
- Impacted files, workflows, or deployed resources.
- Reproduction steps when safe to share.
- Any evidence that does not expose secrets or personal data.

## Secret handling

- Never commit Azure credentials, APIM subscription keys, model provider keys, connection strings, or `.env` files.
- The demo client fetches APIM subscription keys at runtime from Azure CLI when environment variables are not supplied.
- Use placeholders in documentation and tests.
- If a secret is exposed, rotate it immediately, revoke the old value, audit usage, and remove it from history according to the incident process.

## Azure deployment identity

GitHub Actions should use workload identity federation with OIDC whenever possible.
The service principal secret fallback (`AZURE_CREDENTIALS`) is allowed only when federation is not available, must be scoped least privilege, and must be rotated regularly.
