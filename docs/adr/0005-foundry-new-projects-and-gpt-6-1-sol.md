# ADR-0005: Use current Foundry projects and GPT-6.1 Sol

- Status: Accepted
- Date: 2026-10-06

## Context

The demo must reflect the current Microsoft Foundry platform shown in [ai.azure.com](https://ai.azure.com), not classic hub-based projects or Azure OpenAI resources.
Each demo region needs a portal-visible project, a model deployment, keyless APIM access, content safety, and repeatable Bicep deployment.
The previous `gpt-5.4-nano` deployment was useful for low-cost smoke tests but no longer represents the current live demo.

`gpt-6.1-sol` version `2026-09-29` is a GA GlobalStandard reasoning model available for the demo in Sweden Central and France Central.
It needs 100K TPM quota per region.
Reasoning requests support `reasoning_effort` values `low`, `medium`, `high`, and `xhigh`; `none` is not supported.
Function tools are not supported on Chat Completions for this model when reasoning is enabled.

## Decision

Deploy one current Foundry resource per region as `Microsoft.CognitiveServices/accounts` kind `AIServices`, API `2026-07-01`, with `allowProjectManagement: true`.
Create one `Microsoft.CognitiveServices/accounts/projects` project per resource: `proj-apimaigw-swc` and `proj-apimaigw-frc`.
Use project endpoints shaped as `https://<account>.services.ai.azure.com/api/projects/<project>` for portal and project-oriented tooling.

Deploy `gpt-6.1-sol` version `2026-09-29` as GlobalStandard with `modelCapacity` 100 in both regions.
Configure APIM model backends to target the Foundry endpoint `https://<account>.services.ai.azure.com/openai` and expose OpenAI v1 traffic through `/inference/openai/v1/...`.
Keep content safety on the account's `*.cognitiveservices.azure.com` endpoint.
Grant APIM `Cognitive Services OpenAI User` and `Cognitive Services User` on each Foundry resource, and grant the deployment/operator identity `Foundry User` so presenters can use the projects in the current Foundry portal.

Run the agent scenario on the Responses API: `POST /inference/openai/v1/responses` through APIM.
Convert MCP tools to Responses API function tools and keep the loop stateless with `store=False`, `include=["reasoning.encrypted_content"]`, and full input resent each turn because the gateway load-balances model turns across regions and a stored response ID created in one region is unknown in the other.

## Consequences

The demo matches the current Foundry portal experience and avoids classic hub-based projects.
Both regions have consistent Foundry project evidence, model deployment evidence, and APIM backend evidence.
Quota planning must request GlobalStandard `gpt-6.1-sol` capacity in Sweden Central and France Central at 100K TPM each.
The agent path demonstrates governing Responses API traffic, not only Chat Completions traffic, and preserves APIM load balancing without cross-region response-state coupling.
Demo scripts and docs must be explicit that `reasoning_effort: none` is unsupported and that Chat Completions function tools are not the right path for this model.

## Alternatives considered

- **Stay on `gpt-5.4-nano`**: rejected because the live demo has moved to `gpt-6.1-sol` and should show the current Foundry resource/project experience.
- **Use `gpt-5-mini`**: rejected because it is an older `2025-08-07` model with deprecation scheduled for 2027-02, so it is a poor anchor for an October 2026 gateway demo.
- **Use `gpt-6-sol`**: considered as a current reasoning-family option, but `gpt-6.1-sol` is the verified live deployment and should remain the documented default.
- **Keep the agent on Chat Completions**: rejected because function tools are not supported on Chat Completions for `gpt-6.1-sol` with reasoning enabled.
- **Use stored Responses API state across turns**: rejected because APIM can route adjacent turns to different regional backends, and a stored response ID from Sweden Central is not known in France Central.
- **Use Foundry classic hub-based projects or Azure OpenAI resources**: rejected because the demo is about the current Foundry platform and current portal experience.
