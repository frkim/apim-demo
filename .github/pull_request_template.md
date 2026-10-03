## Summary

-

## Verification

- [ ] `cd demo; python -m ruff check .`
- [ ] `cd demo; python -m ruff format --check .`
- [ ] `cd demo; python -m mypy ai_gateway`
- [ ] `cd demo; python -m pytest -q`
- [ ] `az bicep build --file infra\main.bicep --stdout > $null`
- [ ] `az bicep lint --file infra\main.bicep`
- [ ] Not applicable; documentation-only change.

## Security and operations

- [ ] No secrets, subscription keys, tokens, or customer data are included.
- [ ] Azure changes were validated with `what-if` or are not applicable.
- [ ] Documentation and ADRs are updated for behavior or architecture changes.

## Risks and follow-up

-
