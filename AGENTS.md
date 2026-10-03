# AGENTS.md

## Project overview

This repository demonstrates Azure API Management as an AI gateway for Zava Retail.
It deploys APIM Basic v2, two Microsoft Foundry AI Services accounts, APIM AI policies, a REST-backed MCP server, and telemetry, then validates the flow with a Python demo client.

- **Client**: Python 3.12+ command-line demo package in `demo/`.
- **Infrastructure**: Azure Bicep under `infra/`.
- **Cloud**: Azure API Management, Microsoft Foundry AI Services, Application Insights, and Log Analytics.
- **Automation**: GitHub Actions for CI, deployment, smoke tests, and teardown.

## Setup

```powershell
cd demo
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
```

Use the Microsoft-protected package feeds configured on the workstation.
Do not override package restore to a public registry.

- PyPI: `https://packagefeedproxy.microsoft.io/pypi/simple`
- npm: `https://packagefeedproxy.microsoft.io/npm/`
- NuGet: `https://packagefeedproxy.microsoft.io/nuget/v3/index.json`

## Commands

| Task | Command |
| --- | --- |
| Install runtime dependencies | `cd demo; python -m pip install -r requirements.txt` |
| Install dev dependencies | `cd demo; python -m pip install -r requirements-dev.txt` |
| Run all demo scenarios | `cd demo; python -m ai_gateway all` |
| Run one scenario | `cd demo; python -m ai_gateway chat` |
| Lint | `cd demo; python -m ruff check .` |
| Format check | `cd demo; python -m ruff format --check .` |
| Type check | `cd demo; python -m mypy ai_gateway` |
| Test | `cd demo; python -m pytest -q` |
| Build Bicep | `az bicep build --file infra\main.bicep --stdout > $null` |
| Lint Bicep | `az bicep lint --file infra\main.bicep` |
| What-if deployment | `az deployment sub what-if -n apimaigw-demo -l swedencentral -f infra\main.bicep --result-format ResourceIdOnly` |
| Deploy | `az deployment sub create -n apimaigw-demo -l swedencentral -f infra\main.bicep` |

## Project structure

```text
.github/workflows/  CI, deployment, and destroy workflows
demo/               Python package, CLI scenarios, and unit tests
docs/adr/           Architecture Decision Records
docs/narrative/     Pitch, run-of-show, demo script, and FAQ
docs/presentations/ Marp source, PDF, and PPTX session deck
docs/research/      APIM AI Gateway research brief
infra/              Subscription-scope Bicep, APIM policies, and OpenAPI spec
video/              Video capture and narration tooling
```

## Standards to follow

Use the engineering standards at <https://github.com/frkim/ai-coding-standards> as the source of truth.
The local standards clone used to bootstrap this repository is `C:\temp\WindowsTemp\ai-coding-standards`.

- Documentation: `instructions/documentation.instructions.md`
- GitHub: `standards/github/github.md`
- Security: `standards/security/security.md`
- Azure: `standards/azure/azure.md`
- Agent contract template: `templates/AGENTS.md`

## Non-negotiables

- Do not commit secrets, API keys, connection strings, tokens, or real customer data.
- Use managed identity for Azure service-to-service access wherever possible.
- Prefer GitHub Actions OIDC for Azure login; use `AZURE_CREDENTIALS` only as a fallback and rotate it regularly.
- Keep all infrastructure as Bicep under `infra/` and validate with `what-if` before deployment.
- Use the smallest Azure SKU that satisfies the demo; document any scale-up in an ADR or PR.
- Keep diagrams in Markdown as Mermaid unless a deck requires a generated asset.
- Update documentation with behavior changes in the same pull request.
- Do not modify owned areas unless explicitly asked: existing `infra/` implementation files, `demo/ai_gateway`, `.github/workflows`, `docs/presentations`, and `docs/narrative`.

## Gotchas

- APIM policy files contain policy expressions; they are not strict XML in the way generic XML linters expect.
- The Bronze TPM bucket refills after about 60 seconds; wait before re-running the token-limit demo.
- Application Insights and Log Analytics telemetry can take several minutes to ingest.
- The first content-safety call after deployment can return a transient 500 while the backend warms; retry once.
- APIM v2 instances are soft-deleted; purge deleted services before reusing names.
- The default model requires GlobalStandard quota for `gpt-5.4-nano` in both `swedencentral` and `francecentral`.
- LLM logging captures prompts and completions; do not run sensitive prompts through the demo without an approved data-handling plan.

## Pull requests

- Use Conventional Commit titles such as `docs: add repository onboarding`.
- Keep PRs focused and describe what changed, why, verification, risks, and follow-up.
- Run the quality gates listed above before requesting review.
- Expect code owner review from `@frkim`.
