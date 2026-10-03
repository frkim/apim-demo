# Contributing

## Branches

Use short-lived branches from `main`:

- `feature/<issue>-<slug>` for new behavior.
- `fix/<issue>-<slug>` for defects.
- `docs/<slug>` for documentation-only changes.
- `chore/<slug>` for maintenance.

## Commits

Use Conventional Commits:

- `feat: add scenario`
- `fix: correct policy parameter`
- `docs: update demo guide`
- `test: add client helper tests`
- `ci: update deployment workflow`
- `chore: refresh dependencies`

Use `!` or a `BREAKING CHANGE:` footer for breaking changes.

## Pull request checklist

- [ ] The PR is focused on one logical change.
- [ ] The description explains what changed, why, how it was verified, risks, and follow-up.
- [ ] Documentation is updated for behavior, command, or architecture changes.
- [ ] No secrets, keys, tokens, customer data, or local `.env` values are committed.
- [ ] Azure changes are in Bicep and include a `what-if` result when relevant.
- [ ] The relevant quality gates pass.

## Quality gates

```powershell
cd demo
python -m pip install -r requirements-dev.txt
python -m ruff check .
python -m ruff format --check .
python -m mypy ai_gateway
python -m pytest -q
cd ..
az bicep build --file infra\main.bicep --stdout > $null
az bicep lint --file infra\main.bicep
```

For deployment changes, also run:

```powershell
az deployment sub what-if -n apimaigw-demo -l swedencentral -f infra\main.bicep --result-format ResourceIdOnly
```
