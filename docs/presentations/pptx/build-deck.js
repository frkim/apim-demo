const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "GitHub Copilot";
pptx.company = "Microsoft";
pptx.subject = "Azure API Management AI Gateway session";
pptx.title = "Azure API Management as your AI Gateway";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Segoe UI Semibold",
  bodyFontFace: "Segoe UI",
  lang: "en-US",
};
pptx.margin = 0;

const SH = pptx.ShapeType;
const C = {
  navy: "0B1E3F",
  teal: "00B7C3",
  blue: "0078D4",
  amber: "FFB900",
  off: "F5F7FA",
  slate: "3B4A5E",
  lightSlate: "8A97A8",
  white: "FFFFFF",
  paleTeal: "D9F7FA",
  paleBlue: "E5F1FB",
  paleAmber: "FFF3CF",
  soft: "EEF3F8",
  red: "D83B01",
  green: "107C10",
};
const W = 13.333;
const H = 7.5;
const M = 0.5;
const TITLE = { fontFace: "Segoe UI Semibold", fontSize: 25, color: C.navy, margin: 0, breakLine: false };
const BODY = { fontFace: "Segoe UI", fontSize: 11.5, color: C.slate, margin: 0.05, breakLine: false, fit: "shrink" };

const slideTitles = [];
const speakerNotes = [];

function freshShadow(opacity = 0.1) {
  return { type: "outer", color: "000000", blur: 3, offset: 1, angle: 45, opacity };
}
function addNotes(slide, text) {
  speakerNotes.push(text.replace(/\s+/g, " ").trim());
}
function footer(slide, idx, section = "Azure API Management AI Gateway — Oct 2026") {
  slide.addText(section, { x: M, y: 7.08, w: 8.7, h: 0.18, fontFace: "Segoe UI", fontSize: 7.5, color: C.lightSlate, margin: 0 });
  slide.addText(String(idx).padStart(2, "0"), { x: 12.5, y: 7.05, w: 0.35, h: 0.18, fontFace: "Segoe UI Semibold", fontSize: 8, color: C.lightSlate, align: "right", margin: 0 });
}
function title(slide, text, idx, kicker) {
  if (kicker) slide.addText(kicker.toUpperCase(), { x: M, y: 0.33, w: 3.5, h: 0.22, fontFace: "Segoe UI Semibold", fontSize: 8, color: C.teal, charSpacing: 1.2, margin: 0 });
  slide.addText(text, { x: M, y: kicker ? 0.57 : 0.38, w: 8.7, h: 0.48, ...TITLE });
  slide.addShape(SH.arc, { x: 11.7, y: 0.13, w: 1.15, h: 1.15, adjustPoint: 0.42, rotate: 0, line: { color: C.teal, width: 3, transparency: 10 }, fill: { color: C.off, transparency: 100 } });
  footer(slide, idx);
}
function addCard(slide, x, y, w, h, head, body, accent = C.teal, icon, options = {}) {
  slide.addShape(SH.rect, { x, y, w, h, fill: { color: options.fill || C.white }, line: { color: options.line || "D8E2EC", width: 0.8 }, shadow: options.shadow === false ? undefined : freshShadow(0.08) });
  slide.addShape(SH.rect, { x, y, w: 0.08, h, fill: { color: accent }, line: { color: accent } });
  if (icon) {
    slide.addShape(SH.ellipse, { x: x + 0.18, y: y + 0.17, w: 0.43, h: 0.43, fill: { color: accent }, line: { color: accent } });
    slide.addText(icon, { x: x + 0.18, y: y + 0.235, w: 0.43, h: 0.16, fontFace: "Segoe UI Semibold", fontSize: 8, color: C.white, align: "center", margin: 0 });
    slide.addText(head, { x: x + 0.72, y: y + 0.14, w: w - 0.9, h: 0.28, fontFace: "Segoe UI Semibold", fontSize: options.headSize || 12.5, color: options.headColor || C.navy, margin: 0, fit: "shrink" });
    slide.addText(body, { x: x + 0.72, y: y + 0.5, w: w - 0.9, h: h - 0.6, ...BODY, fontSize: options.bodySize || 10.4 });
  } else {
    slide.addText(head, { x: x + 0.2, y: y + 0.15, w: w - 0.35, h: 0.28, fontFace: "Segoe UI Semibold", fontSize: options.headSize || 12.5, color: options.headColor || C.navy, margin: 0, fit: "shrink" });
    slide.addText(body, { x: x + 0.2, y: y + 0.5, w: w - 0.35, h: h - 0.6, ...BODY, fontSize: options.bodySize || 10.4 });
  }
}
function addChip(slide, x, y, text, fill = C.paleTeal, color = C.navy, w = 1.1) {
  slide.addShape(SH.roundRect, { x, y, w, h: 0.27, rectRadius: 0.05, fill: { color: fill }, line: { color: fill } });
  slide.addText(text, { x: x + 0.06, y: y + 0.055, w: w - 0.12, h: 0.11, fontFace: "Segoe UI Semibold", fontSize: 7.5, color, align: "center", margin: 0, fit: "shrink" });
}
function addGatewayArch(slide, x, y, w, h, color = C.teal, transparency = 0) {
  slide.addShape(SH.rect, { x, y: y + 0.65, w: 0.18, h: h - 0.65, fill: { color, transparency }, line: { color, transparency } });
  slide.addShape(SH.rect, { x: x + w - 0.18, y: y + 0.65, w: 0.18, h: h - 0.65, fill: { color, transparency }, line: { color, transparency } });
  slide.addShape(SH.arc, { x: x + 0.01, y, w: w - 0.02, h: 1.35, adjustPoint: 0.5, line: { color, width: 7, transparency }, fill: { color, transparency: 100 } });
}
function newSlide(name, bg = C.off) {
  const s = pptx.addSlide();
  s.background = { color: bg };
  slideTitles.push(name);
  return s;
}
function sectionSlide(idx, label, heading, timing, notes, icon = "→") {
  const s = newSlide(heading, C.navy);
  addGatewayArch(s, 8.7, 1.0, 3.3, 5.55, C.teal, 15);
  s.addShape(SH.ellipse, { x: 0.75, y: 0.82, w: 0.72, h: 0.72, fill: { color: C.teal }, line: { color: C.teal } });
  s.addText(icon, { x: 0.75, y: 0.99, w: 0.72, h: 0.22, fontFace: "Segoe UI Semibold", fontSize: 17, color: C.navy, align: "center", margin: 0 });
  s.addText(label.toUpperCase(), { x: 0.75, y: 1.85, w: 4.2, h: 0.26, fontFace: "Segoe UI Semibold", fontSize: 10, color: C.teal, charSpacing: 1.6, margin: 0 });
  s.addText(heading, { x: 0.72, y: 2.25, w: 7.5, h: 1.2, fontFace: "Segoe UI Semibold", fontSize: 38, color: C.white, margin: 0, fit: "shrink" });
  s.addShape(SH.roundRect, { x: 0.75, y: 4.12, w: 1.55, h: 0.45, rectRadius: 0.07, fill: { color: C.amber }, line: { color: C.amber } });
  s.addText(timing, { x: 0.75, y: 4.25, w: 1.55, h: 0.14, fontFace: "Segoe UI Semibold", fontSize: 10, color: C.navy, align: "center", margin: 0 });
  s.addText("90-minute technical session", { x: 0.75, y: 6.95, w: 3.1, h: 0.18, fontFace: "Segoe UI", fontSize: 8, color: "AFC3DA", margin: 0 });
  s.addText(String(idx).padStart(2, "0"), { x: 12.35, y: 6.95, w: 0.4, h: 0.18, fontFace: "Segoe UI Semibold", fontSize: 8, color: "AFC3DA", align: "right", margin: 0 });
  addNotes(s, notes);
  return s;
}
function addTextBlock(slide, x, y, w, h, lines, fontSize = 11) {
  slide.addText(lines.map((t, i) => ({ text: t, options: { bullet: i > -1, breakLine: i !== lines.length - 1 } })), {
    x, y, w, h, fontFace: "Segoe UI", fontSize, color: C.slate, margin: 0.03, paraSpaceAfterPt: 5, fit: "shrink",
  });
}
function addFlow(slide, labels, y, startX, gap, w, colors = [C.blue, C.teal, C.amber]) {
  labels.forEach((l, i) => {
    const x = startX + i * (w + gap);
    slide.addShape(SH.roundRect, { x, y, w, h: 0.68, rectRadius: 0.08, fill: { color: colors[i % colors.length] }, line: { color: colors[i % colors.length] } });
    slide.addText(l, { x: x + 0.08, y: y + 0.2, w: w - 0.16, h: 0.18, fontFace: "Segoe UI Semibold", fontSize: 8.8, color: i % colors.length === 2 ? C.navy : C.white, align: "center", margin: 0, fit: "shrink" });
    if (i < labels.length - 1) {
      slide.addShape(SH.line, { x: x + w + 0.05, y: y + 0.34, w: gap - 0.1, h: 0, line: { color: C.slate, width: 1.4, beginArrowType: "none", endArrowType: "triangle" } });
    }
  });
}

let n = 0;

{
  const s = newSlide("Title", C.navy); n++;
  addGatewayArch(s, 8.95, 0.85, 3.25, 5.8, C.teal, 5);
  s.addText("Azure API Management as your AI Gateway", { x: 0.78, y: 1.1, w: 7.8, h: 1.45, fontFace: "Segoe UI Semibold", fontSize: 38, color: C.white, margin: 0, fit: "shrink" });
  s.addText("Govern models, MCP tools and agents at scale", { x: 0.82, y: 2.85, w: 6.75, h: 0.35, fontFace: "Segoe UI", fontSize: 18, color: "D7E7F6", margin: 0 });
  s.addText("Security, cost control, resiliency and observability for every AI call — Oct 2026 edition", { x: 0.82, y: 3.36, w: 7.3, h: 0.34, fontFace: "Segoe UI", fontSize: 13.5, color: "AFC3DA", margin: 0, fit: "shrink" });
  addChip(s, 0.82, 4.15, "90 min", C.amber, C.navy, 0.9);
  addChip(s, 1.86, 4.15, "Basic v2 demo", C.paleTeal, C.navy, 1.35);
  addChip(s, 3.35, 4.15, "gpt-6.1-sol", C.paleBlue, C.navy, 1.35);
  s.addShape(SH.rect, { x: 0, y: 6.72, w: W, h: 0.78, fill: { color: "06152D" }, line: { color: "06152D" } });
  s.addText("Zava Retail: from AI sprawl to a governed gateway", { x: 0.82, y: 6.98, w: 5.0, h: 0.18, fontFace: "Segoe UI Semibold", fontSize: 9.5, color: C.teal, margin: 0 });
  addNotes(s, "Open with the promise of the session: one control point for every AI call. Set expectations that this is a technical, demo-led walkthrough using Basic v2, Microsoft Foundry resources and projects in Sweden Central and France Central, and gpt-6.1-sol. Emphasize that the deck doubles as a fallback narrative if the live demo environment misbehaves.");
}

{
  const s = newSlide("Agenda"); n++;
  title(s, "Agenda: 90 minutes from problem to production path", n, "Session plan");
  const sections = [
    ["00–05", "Welcome & hook", "AI sprawl story"],
    ["05–15", "Why an AI gateway", "six challenges"],
    ["15–25", "APIM in 2026", "refresher + new capabilities"],
    ["25–40", "Capabilities deep dive", "five pillars"],
    ["40–65", "Live demo", "D1–D8"],
    ["65–75", "Pricing, limits, tiering", "make the trade-offs explicit"],
    ["75–82", "Patterns & labs", "crawl / walk / run"],
    ["82–90", "Takeaways + Q&A", "next steps"],
  ];
  sections.forEach((r, i) => {
    const x = i % 2 === 0 ? 0.75 : 6.85;
    const y = 1.25 + Math.floor(i / 2) * 1.28;
    addCard(s, x, y, 5.65, 0.86, r[1], `${r[0]} · ${r[2]}`, i === 4 ? C.amber : C.teal, String(i + 1), { bodySize: 9.4, shadow: false });
  });
  s.addShape(SH.arc, { x: 11.35, y: 5.55, w: 1.0, h: 1.0, line: { color: C.teal, width: 3, transparency: 15 }, fill: { color: C.off, transparency: 100 } });
  addNotes(s, "Walk through the agenda exactly as timed. Point out that the middle of the session is demo heavy, while the last third makes the operating model concrete with pricing, limits, and adoption patterns. Tell the audience that every section maps to an enterprise concern they can take back to their platform team.");
}

sectionSlide(++n, "Section 1", "Welcome & hook", "00–05 · 5 min", "This divider marks the short opening section. Use it to transition from introductions into the Zava Retail story. The goal is to create urgency without over-selling: most organizations are already beyond one chatbot.", "01");

{
  const s = newSlide("AI sprawl hook"); n++;
  title(s, "The AI sprawl story: one chatbot became forty apps", n, "Welcome & hook");
  s.addShape(SH.roundRect, { x: 0.72, y: 1.18, w: 4.25, h: 4.85, rectRadius: 0.08, fill: { color: C.navy }, line: { color: C.navy } });
  s.addText("Zava Retail", { x: 1.03, y: 1.55, w: 2.4, h: 0.36, fontFace: "Segoe UI Semibold", fontSize: 21, color: C.white, margin: 0 });
  s.addText("40 AI apps\n3 model providers\n1 surprise invoice", { x: 1.04, y: 2.25, w: 2.9, h: 1.0, fontFace: "Segoe UI Semibold", fontSize: 21, color: C.teal, margin: 0, breakLine: false, fit: "shrink" });
  s.addText("No single owner of keys, quotas, safety policy or token telemetry.", { x: 1.04, y: 4.1, w: 3.35, h: 0.54, fontFace: "Segoe UI", fontSize: 13.5, color: "D7E7F6", margin: 0, fit: "shrink" });
  const items = [
    ["Keys in every app", "rotation and breach response become manual"],
    ["429 outages", "quota exhaustion hits customers before ops sees it"],
    ["No safety baseline", "prompt attacks and unsafe outputs vary by team"],
    ["No chargeback", "finance sees a bill, not accountable products"],
  ];
  items.forEach((it, i) => addCard(s, 5.35 + (i % 2) * 3.45, 1.35 + Math.floor(i / 2) * 1.8, 3.0, 1.27, it[0], it[1], i === 1 ? C.amber : C.teal, ["K", "429", "S", "$"][i], { bodySize: 9.3 }));
  addNotes(s, "Tell the Zava Retail story as the hook. They started with one chatbot, then every team added their own app, provider account, and tool integration. The surprise invoice is not just a cost issue: it exposes missing governance, resiliency, safety and observability.");
}

sectionSlide(++n, "Section 2", "Why an AI gateway", "05–15 · 10 min", "This divider introduces the problem framing. Explain that APIM is valuable because it sits in the path of every request and can enforce policy before the model, MCP tool, or agent is called.", "02");

{
  const s = newSlide("Six challenges"); n++;
  title(s, "Six challenges appear when AI moves past the pilot", n, "Why an AI gateway");
  const challenges = [
    ["Credential sprawl", "Keys, tokens and provider accounts copied into apps."],
    ["Cost & quota exhaustion", "One product can burn shared TPM/PTU or trigger 429s."],
    ["Resiliency gaps", "Every app reimplements retries, failover and backoff."],
    ["Safety & compliance", "No consistent Prompt Shields, harm categories or blocklists."],
    ["Observability & chargeback", "Token spend and prompt logs are fragmented."],
    ["MCP tool & agent sprawl", "Tools and A2A agents multiply without central registry."],
  ];
  challenges.forEach((c, i) => addCard(s, 0.72 + (i % 3) * 4.1, 1.25 + Math.floor(i / 3) * 2.05, 3.66, 1.35, c[0], c[1], [C.teal, C.blue, C.amber][i % 3], String(i + 1), { bodySize: 9.8 }));
  s.addShape(SH.chevron, { x: 5.1, y: 5.75, w: 3.1, h: 0.52, fill: { color: C.navy }, line: { color: C.navy } });
  s.addText("The gateway makes these policies shared infrastructure.", { x: 5.45, y: 5.92, w: 2.4, h: 0.16, fontFace: "Segoe UI Semibold", fontSize: 8.5, color: C.white, align: "center", margin: 0, fit: "shrink" });
  addNotes(s, "Frame these as operational symptoms rather than product features. The gateway pattern centralizes controls that each app otherwise has to solve independently. Highlight that the same gateway handles model APIs, MCP tools, and A2A agents, which matters as architectures evolve from chatbots to agentic systems.");
}

sectionSlide(++n, "Section 3", "APIM in 2026", "15–25 · 10 min", "This section refreshes the APIM mental model and then anchors the audience on what changed in 2026. Keep it factual and dated, because the product surface is moving quickly.", "03");

{
  const s = newSlide("APIM refresher"); n++;
  title(s, "APIM refresher: three planes, one governed path", n, "APIM in 2026");
  addGatewayArch(s, 4.92, 1.28, 3.5, 4.5, C.teal, 0);
  addCard(s, 0.75, 1.55, 3.35, 1.15, "Gateway", "Runtime path for API, model, MCP and agent traffic; policies execute here.", C.teal, "G", { bodySize: 9.2 });
  addCard(s, 4.98, 2.25, 3.38, 1.15, "Management plane", "APIs, products, subscriptions, policies, backends, diagnostics and workspaces.", C.blue, "M", { bodySize: 9.2 });
  addCard(s, 9.25, 1.55, 3.35, 1.15, "Developer portal", "Discovery and self-service subscription for internal teams and partners.", C.amber, "D", { bodySize: 9.2 });
  addFlow(s, ["Apps / agents", "APIM gateway", "Backends / tools"], 4.85, 2.25, 0.5, 2.35);
  s.addText("Products = teams · Subscriptions = consumers · Policies = enforceable controls", { x: 1.3, y: 6.05, w: 10.6, h: 0.25, fontFace: "Segoe UI Semibold", fontSize: 12, color: C.navy, align: "center", margin: 0 });
  addNotes(s, "Refresh APIM for people who know it only as an API gateway. The gateway is the runtime enforcement point, the management plane is where the platform team configures APIs and policies, and the developer portal is how consumers discover and subscribe. This same model now applies to LLM endpoints, MCP servers and agent APIs.");
}

{
  const s = newSlide("What's new in 2026"); n++;
  title(s, "What's new in 2026: APIM as AI gateway", n, "Dated highlights");
  const updates = [
    ["Sep 2026", "Workspaces extended to Basic v2 and Standard v2."],
    ["Sep 2026", "Premium v2 GA and v2 scale refreshed: Basic/Standard v2 to 10 units, Premium v2 to 30."],
    ["Aug 2026", "llm-content-safety protects MCP tool calls and A2A agent API traffic."],
    ["Jun 2026", "Programmatic MCP management via API tools sub-resource, 2025-09-01-preview."],
    ["Oct 2026", "Foundry (new): resource + project per region in ai.azure.com; no classic hub or Azure OpenAI resource."],
    ["Sep 2026", "Token metrics include cached, reasoning and thinking token categories in preview."],
  ];
  updates.forEach((u, i) => {
    const y = 1.17 + i * 0.78;
    slideTimelineItem(s, y, u[0], u[1], i);
  });
  addChip(s, 9.5, 5.95, "MCP", C.paleTeal, C.navy, 0.78);
  addChip(s, 10.42, 5.95, "A2A", C.paleBlue, C.navy, 0.78);
  addChip(s, 11.34, 5.95, "Unified API", C.paleAmber, C.navy, 1.2);
  addNotes(s, "This slide is intentionally dated. The point is that APIM is not only an API product anymore; it has first-class patterns for model APIs, MCP servers and A2A agents. The deployed Foundry platform is the current resource plus project model in ai.azure.com, not the classic hub-based project pattern. Cite the updated Learn pages and research brief when challenged on dates.");
}
function slideTimelineItem(s, y, date, text, i) {
  s.addShape(SH.ellipse, { x: 0.86, y: y + 0.05, w: 0.32, h: 0.32, fill: { color: i % 2 ? C.blue : C.teal }, line: { color: i % 2 ? C.blue : C.teal } });
  s.addShape(SH.line, { x: 1.02, y: y + 0.38, w: 0, h: 0.42, line: { color: "C7D5E3", width: 1.2 } });
  s.addText(date, { x: 1.42, y, w: 1.35, h: 0.22, fontFace: "Segoe UI Semibold", fontSize: 10, color: C.navy, margin: 0 });
  s.addText(text, { x: 2.86, y, w: 8.85, h: 0.25, fontFace: "Segoe UI", fontSize: 11.2, color: C.slate, margin: 0, fit: "shrink" });
}

sectionSlide(++n, "Section 4", "AI gateway capabilities deep dive", "25–40 · 15 min", "This section turns the problem statement into five concrete capability pillars. Use the next five slides as the technical backbone of the session before switching into the live environment.", "04");

{
  const s = newSlide("Pillar: Security"); n++;
  title(s, "Pillar 1 — Security: keyless and safe by default", n, "Capabilities");
  addCard(s, 0.75, 1.25, 3.35, 1.15, "Managed identity", "Apps hold only an APIM subscription key; APIM authenticates to Foundry.", C.teal, "MI");
  addCard(s, 0.75, 2.78, 3.35, 1.15, "OAuth + JWT", "Credential manager and JWT validation protect AI apps, agents and APIs.", C.blue, "JWT");
  addCard(s, 0.75, 4.31, 3.35, 1.15, "Content safety", "Prompt Shields, harm categories and blocklists enforced centrally.", C.amber, "CS");
  s.addShape(SH.rect, { x: 4.85, y: 1.33, w: 7.45, h: 3.95, fill: { color: "06152D" }, line: { color: "06152D" }, shadow: freshShadow(0.1) });
  s.addText(`<llm-content-safety backend-id=\"content-safety\" shield-prompt=\"true\">\n  <categories output-type=\"EightSeverityLevels\">\n    <category name=\"Hate\" threshold=\"4\" />\n    <category name=\"SelfHarm\" threshold=\"4\" />\n    <category name=\"Sexual\" threshold=\"4\" />\n    <category name=\"Violence\" threshold=\"4\" />\n  </categories>\n</llm-content-safety>`, { x: 5.15, y: 1.62, w: 6.82, h: 2.65, fontFace: "Consolas", fontSize: 10.3, color: "D7E7F6", margin: 0.08, breakLine: false, fit: "shrink" });
  s.addText("Demo: jailbreak blocked before it reaches gpt-6.1-sol.", { x: 5.15, y: 4.67, w: 6.82, h: 0.25, fontFace: "Segoe UI Semibold", fontSize: 11, color: C.teal, margin: 0 });
  addNotes(s, "Security starts with removing model keys from application code. In the demo, APIM uses its managed identity to call Foundry, while applications only know the APIM subscription key. The llm-content-safety policy provides a single safety baseline across chat, MCP tool calls and A2A agent traffic.");
}

{
  const s = newSlide("Pillar: Cost & scale"); n++;
  title(s, "Pillar 2 — Cost & scale: token budgets as policy", n, "Capabilities");
  s.addShape(SH.rect, { x: 0.75, y: 1.18, w: 6.35, h: 3.62, fill: { color: "06152D" }, line: { color: "06152D" }, shadow: freshShadow(0.1) });
  s.addText(`<llm-token-limit counter-key=\"@(context.Subscription.Id)\"\n  tokens-per-minute=\"300\"\n  token-quota=\"100000\"\n  token-quota-period=\"Monthly\"\n  estimate-prompt-tokens=\"false\"\n  remaining-tokens-header-name=\"x-ratelimit-remaining-tokens\"\n  remaining-quota-tokens-header-name=\"x-quota-remaining-tokens\"\n  tokens-consumed-header-name=\"x-tokens-consumed\" />`, { x: 1.0, y: 1.4, w: 5.95, h: 2.7, fontFace: "Consolas", fontSize: 11.5, color: "D7E7F6", margin: 0.03, valign: "top", lineSpacingMultiple: 1.15 });
  s.addText("Bronze sandbox: 300 tokens/min · 100K/month", { x: 1.0, y: 4.43, w: 5.55, h: 0.18, fontFace: "Segoe UI Semibold", fontSize: 10.2, color: C.amber, margin: 0 });
  addCard(s, 7.55, 1.25, 2.2, 1.25, "Semantic caching", "Reuse similar completions with Managed Redis.", C.teal, undefined, { bodySize: 9.1 });
  addCard(s, 10.15, 1.25, 2.2, 1.25, "PTU-first", "Use priority routing for reserved capacity, spill over when needed.", C.blue, undefined, { bodySize: 8.7 });
  addCard(s, 7.55, 3.0, 2.2, 1.25, "Headers", "x-ratelimit-remaining-tokens, x-quota-remaining-tokens and x-tokens-consumed.", C.amber, undefined, { bodySize: 7.9 });
  addCard(s, 10.15, 3.0, 2.2, 1.25, "Chargeback", "Product and subscription dimensions map cost to teams.", C.teal, undefined, { bodySize: 8.7 });
  s.addText("Cost controls apply before the model call, not after finance receives the bill.", { x: 7.0, y: 5.1, w: 5.1, h: 0.45, fontFace: "Segoe UI Semibold", fontSize: 15, color: C.navy, margin: 0, fit: "shrink" });
  addNotes(s, "Token limits are a gateway-native guardrail. For the demo, Gold receives 20,000 tokens per minute and 5 million tokens per month, while Bronze receives 300 tokens per minute and 100,000 tokens per month. Explain that semantic caching and PTU-first spillover are complementary patterns for reducing cost and protecting capacity.");
}

{
  const s = newSlide("Pillar: Resiliency"); n++;
  title(s, "Pillar 3 — Resiliency: pools, retry and circuit breaker", n, "Capabilities");
  addFlow(s, ["Client", "APIM retry", "foundry-pool"], 1.35, 0.9, 0.48, 2.1, [C.slate, C.blue, C.teal]);
  s.addShape(SH.roundRect, { x: 8.1, y: 1.1, w: 1.65, h: 0.75, rectRadius: 0.08, fill: { color: C.paleBlue }, line: { color: C.blue, width: 1.2 } });
  s.addText("Sweden\nCentral", { x: 8.22, y: 1.27, w: 1.4, h: 0.28, fontFace: "Segoe UI Semibold", fontSize: 10, color: C.navy, align: "center", margin: 0, fit: "shrink" });
  s.addShape(SH.roundRect, { x: 10.42, y: 1.1, w: 1.65, h: 0.75, rectRadius: 0.08, fill: { color: C.paleTeal }, line: { color: C.teal, width: 1.2 } });
  s.addText("France\nCentral", { x: 10.54, y: 1.27, w: 1.4, h: 0.28, fontFace: "Segoe UI Semibold", fontSize: 10, color: C.navy, align: "center", margin: 0, fit: "shrink" });
  s.addShape(SH.line, { x: 7.25, y: 1.54, w: 0.85, h: 0, line: { color: C.slate, width: 1.4, endArrowType: "triangle" } });
  s.addShape(SH.line, { x: 7.25, y: 2.1, w: 3.15, h: 0, line: { color: C.slate, width: 1.4, endArrowType: "triangle" } });
  addCard(s, 0.9, 3.0, 3.55, 1.35, "Weighted 50/50", "Six requests spread across Sweden Central and France Central.", C.teal, "50");
  addCard(s, 4.9, 3.0, 3.55, 1.35, "Circuit breaker", "Trips on 429/5xx and honors Retry-After from backend.", C.amber, "CB");
  addCard(s, 8.9, 3.0, 3.55, 1.35, "Retry policy", "Retry through the pool instead of teaching every app to back off.", C.blue, "R");
  s.addText("Backend pools support round-robin, weighted and priority routing; pools support up to 30 backends.", { x: 1.2, y: 5.35, w: 10.9, h: 0.25, fontFace: "Segoe UI Semibold", fontSize: 11.2, color: C.navy, align: "center", margin: 0 });
  addNotes(s, "Resiliency is where the gateway prevents every app team from writing its own failover code. In this environment, the foundry-pool is weighted 50/50 across Sweden Central and France Central. The circuit breaker honors Retry-After on 429s, which is critical for model quota pressure.");
}

{
  const s = newSlide("Pillar: Observability"); n++;
  title(s, "Pillar 4 — Observability: token telemetry and LLM logs", n, "Capabilities");
  s.addShape(SH.rect, { x: 0.75, y: 1.25, w: 4.0, h: 3.45, fill: { color: C.white }, line: { color: "D8E2EC" }, shadow: freshShadow(0.08) });
  s.addChart(pptx.ChartType.bar, [{ name: "Tokens", labels: ["Gold", "Bronze", "Internal"], values: [5.0, 0.1, 1.4] }], {
    x: 1.0, y: 1.65, w: 3.45, h: 2.4, catAxisLabelFontFace: "Segoe UI", valAxisLabelFontFace: "Segoe UI", showLegend: false, showValue: true, valGridLine: { color: "E2E8F0", size: 0.5 }, chartColors: [C.teal], showTitle: false,
  });
  s.addText("Token usage by product", { x: 1.02, y: 4.25, w: 3.45, h: 0.16, fontFace: "Segoe UI Semibold", fontSize: 9.5, color: C.navy, align: "center", margin: 0 });
  s.addShape(SH.rect, { x: 5.15, y: 1.25, w: 7.1, h: 3.45, fill: { color: "06152D" }, line: { color: "06152D" }, shadow: freshShadow(0.08) });
  s.addText(`AppMetrics\n| where Namespace == \"ai-gateway\"\n| summarize Tokens=sum(Sum) by Product\n\nApiManagementGatewayLlmLog\n| summarize Calls=count() by DeploymentName\n| where DeploymentName == \"gpt-6.1-sol\"`, { x: 5.45, y: 1.6, w: 6.5, h: 2.3, fontFace: "Consolas", fontSize: 11.3, color: "D7E7F6", margin: 0.05, fit: "shrink" });
  s.addText("Dimensions: Subscription ID · Product · API ID · Client IP", { x: 5.45, y: 4.18, w: 6.55, h: 0.16, fontFace: "Segoe UI Semibold", fontSize: 9.2, color: C.teal, margin: 0 });
  addCard(s, 1.0, 5.32, 3.55, 0.75, "Workbook", "Built-in workbook surfaces consumption patterns.", C.blue, "W", { bodySize: 8.1 });
  addCard(s, 4.9, 5.32, 3.55, 0.75, "FinOps", "Chargeback per team, product and subscription.", C.amber, "$", { bodySize: 8.1 });
  addCard(s, 8.8, 5.32, 3.55, 0.75, "Debugging", "Prompt/completion logs explain agent behavior.", C.teal, "L", { bodySize: 8.1 });
  addNotes(s, "Observability closes the loop. The llm-emit-token-metric policy emits custom token metrics with up to five dimensions, while LLM logging writes prompt and completion records to Log Analytics. Explain how this enables cost allocation, troubleshooting, and compliance review.");
}

{
  const s = newSlide("Pillar: MCP & agents"); n++;
  title(s, "Pillar 5 — MCP & agents: govern tools and APIs", n, "Capabilities");
  addFlow(s, ["REST API", "APIM MCP server", "MCP clients"], 1.35, 0.85, 0.45, 2.25, [C.blue, C.teal, C.amber]);
  addFlow(s, ["Existing MCP", "APIM pass-through", "Foundry / Copilot Studio"], 2.55, 0.85, 0.45, 2.25, [C.slate, C.teal, C.blue]);
  addFlow(s, ["A2A agent API", "APIM mediation", "Agent card rewritten"], 3.75, 0.85, 0.45, 2.25, [C.slate, C.teal, C.amber]);
  addCard(s, 9.3, 1.15, 2.6, 1.08, "API Center", "Registry for APIs, MCP servers and agents.", C.blue, "AC", { bodySize: 8.8 });
  addCard(s, 9.3, 2.65, 2.6, 1.08, "Limits", "MCP: tools only, not Consumption, not workspaces.", C.amber, "!", { bodySize: 8.8 });
  addCard(s, 9.3, 4.15, 2.6, 1.08, "Policy scope", "Policies apply across all tools in a server.", C.teal, "P", { bodySize: 8.8 });
  s.addText("D6: Responses API turns the MCP tool list into function tools; APIM policies still apply.", { x: 1.1, y: 5.55, w: 10.8, h: 0.25, fontFace: "Segoe UI Semibold", fontSize: 12, color: C.navy, align: "center", margin: 0 });
  addNotes(s, "MCP and agents are important because enterprises are moving from direct model calls to tool-using systems. APIM can expose existing REST APIs as MCP servers, pass through existing MCP servers, and import A2A agent APIs. D6 uses the Responses API with tools converted from the MCP tool list, and the same gateway policies apply to Chat Completions and Responses API traffic. Stress the limits: MCP is tools-only today, not available in Consumption, and not supported inside workspaces.");
}

sectionSlide(++n, "Section 5", "Live demo", "40–65 · 25 min", "Use this divider to switch from concepts to the deployed repository. Remind the audience that the live demo uses Basic v2, two Foundry resources plus projects, gpt-6.1-sol, product-scoped token budgets, content safety, MCP and observability.", "05");

{
  const s = newSlide("Reference architecture"); n++;
  title(s, "Reference architecture: one policy chain", n, "Live demo");
  const arrowLine = (x, y, w, h, dash) => s.addShape(SH.line, { x, y, w, h, line: { color: C.slate, width: 1.2, endArrowType: "triangle", ...(dash ? { dash: "dash" } : {}) } });
  const node = (x, y, w, h, text, fill, line, size = 10) => {
    s.addShape(SH.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: fill }, line: { color: line } });
    s.addText(text, { x: x + 0.12, y: y + 0.1, w: w - 0.24, h: h - 0.2, fontFace: "Segoe UI Semibold", fontSize: size, color: C.navy, align: "center", valign: "middle", margin: 0, fit: "shrink" });
  };
  node(0.65, 2.25, 2.15, 1.3, "Apps\nAgents\nSDK clients", C.paleBlue, C.blue, 12);
  s.addShape(SH.roundRect, { x: 3.3, y: 1.25, w: 4.4, h: 3.2, rectRadius: 0.12, fill: { color: C.navy }, line: { color: C.teal, width: 1.4 } });
  s.addText("APIM AI Gateway\nBasic v2 · Sweden Central", { x: 3.55, y: 1.4, w: 3.9, h: 0.6, fontFace: "Segoe UI Semibold", fontSize: 14, color: C.white, align: "center", margin: 0, fit: "shrink" });
  const pills = [
    ["auth", 3.62, 2.3, 0.95],
    ["content safety", 4.72, 2.3, 1.4],
    ["token limit", 6.27, 2.3, 1.1],
    ["token metrics", 3.95, 3.1, 1.45],
    ["load balancer", 5.6, 3.1, 1.45],
  ];
  pills.forEach(([p, x, y, w], i) => addChip(s, x, y, p, i === 1 ? C.paleAmber : C.paleTeal, C.navy, w));
  s.addText("policy chain on every model and tool call", { x: 3.55, y: 3.85, w: 3.9, h: 0.3, fontFace: "Segoe UI", fontSize: 9, color: C.paleTeal, align: "center", margin: 0 });
  node(8.72, 1.1, 3.25, 1.18, "Foundry project · Sweden Central\nproj-apimaigw-swc\ngpt-6.1-sol · GlobalStandard\nv2026-09-29 · 100K TPM", C.paleBlue, C.blue, 7.5);
  node(8.72, 2.55, 3.25, 1.18, "Foundry project · France Central\nproj-apimaigw-frc\ngpt-6.1-sol · GlobalStandard\nv2026-09-29 · 100K TPM", C.paleTeal, C.teal, 7.5);
  node(8.9, 3.9, 2.9, 0.85, "MCP server\n/zava-mcp/mcp", C.paleAmber, C.amber);
  node(8.9, 5.3, 2.9, 0.85, "Zava Retail API\nsearch-products · get-order-status", C.white, "D8E2EC", 9);
  node(3.3, 5.3, 4.4, 0.85, "Application Insights · Log Analytics\ntoken metrics per product · LLM logs", C.white, "D8E2EC", 10);
  arrowLine(2.8, 2.9, 0.5, 0);
  arrowLine(7.7, 1.69, 1.02, 0);
  arrowLine(7.7, 3.14, 1.02, 0);
  arrowLine(7.7, 4.3, 1.2, 0);
  arrowLine(10.35, 4.75, 0, 0.55);
  arrowLine(5.5, 4.45, 0, 0.85, true);
  s.addText("Model path", { x: 7.8, y: 1.5, w: 1.0, h: 0.2, fontFace: "Segoe UI Semibold", fontSize: 8, color: C.blue, margin: 0 });
  s.addText("Tool path", { x: 7.8, y: 4.02, w: 1.0, h: 0.2, fontFace: "Segoe UI Semibold", fontSize: 8, color: C.amber, margin: 0 });
  s.addText("telemetry", { x: 5.62, y: 4.75, w: 1.0, h: 0.2, fontFace: "Segoe UI Semibold", fontSize: 8, color: C.slate, margin: 0 });
  addNotes(s, "This is the main architecture diagram and is drawn with editable native shapes. Read it left to right: apps and agents call APIM, policies execute as a chain, model traffic goes to the current Foundry resource plus project in each region, and tool traffic goes through the MCP server to the mocked Zava Retail API. APIM backends call the Foundry OpenAI v1 endpoint with managed identity and key auth disabled. Observability is emitted to Application Insights and Log Analytics.");
}

{
  const s = newSlide("Live demo map"); n++;
  title(s, "Live demo map: D1–D8", n, "Live demo");
  const demos = [
    ["D1", "Keyless chat", "200 via Sweden Central; token headers show 44 prompt / 94 completion and 19,862 remaining."],
    ["D2", "Load balancing", "Six calls alternate France Central and Sweden Central; circuit breaker explained."],
    ["D3", "Token budgets", "Bronze returns 200 x6 then 429 Retry-After 11; Gold continues."],
    ["D4", "Content safety", "Benign prompt passes; jailbreak blocked by Prompt Shields."],
    ["D5", "MCP server", "Initialize, tools/list, tools/call search-products and get-order-status."],
    ["D6", "Agent", "Responses API converts MCP tools to function tools; store=false keeps it stateless."],
    ["D7", "Observability", "AppMetrics by Product and ApiManagementGatewayLlmLog by DeploymentName gpt-6.1-sol."],
    ["D8", "CI/CD", "Bicep deployed by GitHub Actions: deploy, smoke test, run demo."],
  ];
  demos.forEach((d, i) => {
    const x = 0.7 + (i % 2) * 6.0;
    const y = 1.16 + Math.floor(i / 2) * 1.2;
    addCard(s, x, y, 5.65, 0.8, `${d[0]}  ${d[1]}`, d[2], i === 2 ? C.amber : C.teal, undefined, { bodySize: 8.2, headSize: 10.8, shadow: false });
  });
  s.addShape(SH.roundRect, { x: 0.9, y: 6.15, w: 11.35, h: 0.38, rectRadius: 0.05, fill: { color: C.paleBlue }, line: { color: C.paleBlue } });
  s.addText("Narrated fallback video: docs/video/apim-ai-gateway-demo.mp4", { x: 1.15, y: 6.27, w: 10.8, h: 0.12, fontFace: "Segoe UI Semibold", fontSize: 8.6, color: C.navy, align: "center", margin: 0, fit: "shrink" });
  addNotes(s, "Use this map as the run-of-show for the live demo. It also sets audience expectations for what they should see in each scenario, including the verified live outputs from today. If the live environment is unavailable, use the narrated demo video at docs/video/apim-ai-gateway-demo.mp4 and the backup slides.");
}

{
  const s = newSlide("Backup: D1-D2"); n++;
  title(s, "Backup demo narrative: D1 keyless chat + D2 failover", n, "If live demo fails");
  addCard(s, 0.75, 1.2, 5.7, 3.0, "D1 verified output", "HTTP 200 via Sweden Central. App uses only an APIM subscription key; APIM authenticates to Foundry with managed identity.", C.teal, "D1", { bodySize: 10.2 });
  addCard(s, 6.9, 1.2, 5.7, 3.0, "D2 verified output", "Six requests alternate France Central / Sweden Central. Circuit breaker remains ready for 429/5xx failover.", C.blue, "D2", { bodySize: 10.2 });
  s.addShape(SH.rect, { x: 1.1, y: 4.8, w: 11.1, h: 0.75, fill: { color: "06152D" }, line: { color: "06152D" } });
  s.addText(`D1: 200 OK · region=swedencentral · prompt=44 · completion=94 · remaining=19862\nD2: francecentral → swedencentral → francecentral → swedencentral → francecentral → swedencentral`, { x: 1.35, y: 5.03, w: 10.6, h: 0.24, fontFace: "Consolas", fontSize: 10.0, color: "D7E7F6", margin: 0, fit: "shrink" });
  addNotes(s, "If the live environment is unavailable, use this as the screenshot-style talk track. D1 proves keyless backend access and stable client code with the verified Sweden Central response: 44 prompt tokens, 94 completion tokens and 19,862 remaining. D2 proves that load balancing is active by alternating requests across France Central and Sweden Central.");
}

{
  const s = newSlide("Backup: D3"); n++;
  title(s, "Backup demo narrative: D3 token budgets per team", n, "If live demo fails");
  addCard(s, 0.8, 1.2, 3.35, 1.28, "Gold product", "20,000 tokens/min · 5M tokens/month · customer support copilot keeps running.", C.teal, "G");
  addCard(s, 4.75, 1.2, 3.35, 1.28, "Bronze product", "300 tokens/min · 100K tokens/month · marketing sandbox is intentionally constrained.", C.amber, "B");
  addCard(s, 8.7, 1.2, 3.35, 1.28, "Gateway result", "Bronze returns 200 six times, then 429 with Retry-After 11; Gold still returns 200.", C.red, "429");
  s.addShape(SH.rect, { x: 1.0, y: 3.15, w: 11.3, h: 1.55, fill: { color: "06152D" }, line: { color: "06152D" } });
  s.addText(`Bronze calls: 200 x6 · remaining: 239, 176, 123, 81, 9, 0\nThen: HTTP/1.1 429 Too Many Requests · Retry-After: 11\nGold call after Bronze throttle: HTTP 200`, { x: 1.35, y: 3.48, w: 10.6, h: 0.58, fontFace: "Consolas", fontSize: 12.1, color: "D7E7F6", margin: 0, fit: "shrink" });
  s.addText("The business policy is readable: teams get different budgets without changing model deployments.", { x: 1.2, y: 5.35, w: 10.7, h: 0.3, fontFace: "Segoe UI Semibold", fontSize: 14, color: C.navy, align: "center", margin: 0 });
  addNotes(s, "Explain that this is product-scoped governance. Bronze is deliberately small to show rate limiting quickly, while Gold continues to work. The headers make the policy visible to client teams and help developers back off gracefully.");
}

{
  const s = newSlide("Backup: D4"); n++;
  title(s, "Backup: D4 content safety blocks prompt attack", n, "If live demo fails");
  addCard(s, 0.85, 1.25, 5.4, 1.55, "Benign prompt", "Verified HTTP 200; forwarded through APIM to gpt-6.1-sol.", C.teal, "OK", { bodySize: 10.5 });
  addCard(s, 7.05, 1.25, 5.4, 1.55, "Jailbreak prompt", "Verified HTTP 403 from llm-content-safety before the model call.", C.red, "403", { bodySize: 10.5 });
  s.addShape(SH.rect, { x: 1.15, y: 3.45, w: 10.95, h: 1.2, fill: { color: "06152D" }, line: { color: "06152D" } });
  s.addText(`HTTP/1.1 403 Forbidden\n{\"statusCode\":403,\"message\":\"Request failed content safety check.\"}`, { x: 1.45, y: 3.78, w: 10.35, h: 0.35, fontFace: "Consolas", fontSize: 12, color: "D7E7F6", margin: 0, fit: "shrink" });
  s.addText("Safety is applied consistently to model prompts, MCP tool calls and A2A agent traffic.", { x: 1.25, y: 5.28, w: 10.7, h: 0.25, fontFace: "Segoe UI Semibold", fontSize: 13.5, color: C.navy, align: "center", margin: 0 });
  addNotes(s, "Use this slide to show the audience the expected contrast between a normal prompt and a prompt attack. The important point is that the model never sees the jailbreak prompt. This is a centralized safety baseline, not a library every team must remember to call.");
}

{
  const s = newSlide("Backup: D5-D6"); n++;
  title(s, "Backup: D5 MCP tools + D6 agent", n, "If live demo fails");
  addCard(s, 0.8, 1.12, 5.65, 1.25, "D5: tools/list", "Server name: Azure API Management. Tools: search-products and get-order-status.", C.teal, "D5");
  addCard(s, 6.9, 1.12, 5.65, 1.25, "D6: Responses API", "Agent converted MCP tools into function tools; store=false keeps the turn stateless.", C.blue, "D6");
  s.addShape(SH.rect, { x: 0.9, y: 2.8, w: 5.5, h: 2.0, fill: { color: "06152D" }, line: { color: "06152D" } });
  s.addText(`server: \"Azure API Management\"\ntools/list → [\"search-products\", \"get-order-status\"]\ntools/call search-products {\"category\":\"outdoor\",\"maxPrice\":100}`, { x: 1.18, y: 3.08, w: 5.0, h: 1.15, fontFace: "Consolas", fontSize: 10.1, color: "D7E7F6", margin: 0, fit: "shrink" });
  s.addShape(SH.rect, { x: 6.9, y: 2.8, w: 5.5, h: 2.0, fill: { color: "06152D" }, line: { color: "06152D" } });
  s.addText(`Agent answer:\n\"Trail backpack 30L (€89.90) and Headlamp 400lm (€34.50) are under 100 EUR.\nORD-1042 is out for delivery with Zava Express.\"`, { x: 7.18, y: 3.12, w: 5.0, h: 1.05, fontFace: "Consolas", fontSize: 10.2, color: "D7E7F6", margin: 0, fit: "shrink" });
  s.addText("The same APIM policies protect tools and model calls, so agent autonomy stays governed.", { x: 1.25, y: 5.38, w: 10.8, h: 0.25, fontFace: "Segoe UI Semibold", fontSize: 13, color: C.navy, align: "center", margin: 0 });
  addNotes(s, "D5 proves that an existing REST API can become an MCP server through APIM; get-order-status returns ORD-1042 as out for delivery. D6 uses the Responses API through APIM at /inference/openai/v1/responses. The client converts the MCP tool list into function tools, sends store=false, resends encrypted reasoning items for stateless load-balanced turns, and model turns were served by both France Central and Sweden Central.");
}

{
  const s = newSlide("Backup: D7-D8"); n++;
  title(s, "Backup demo narrative: D7 observability + D8 CI/CD", n, "If live demo fails");
  addCard(s, 0.8, 1.15, 3.4, 1.25, "D7 token metrics", "AppMetrics shows token consumption by Product: Gold and Bronze.", C.teal, "KQL");
  addCard(s, 4.95, 1.15, 3.4, 1.25, "D7 LLM logs", "ApiManagementGatewayLlmLog groups calls by DeploymentName: gpt-6.1-sol.", C.blue, "LOG");
  addCard(s, 9.1, 1.15, 3.4, 1.25, "D8 CI/CD", "GitHub Actions deploys Bicep, smoke-tests and runs demo scenarios.", C.amber, "CI");
  s.addShape(SH.rect, { x: 1.0, y: 3.0, w: 11.25, h: 1.35, fill: { color: "06152D" }, line: { color: "06152D" } });
  s.addText(`AppMetrics | summarize Tokens=sum(Sum) by Product   // Gold, Bronze\nApiManagementGatewayLlmLog | summarize Calls=count() by DeploymentName   // gpt-6.1-sol\n.github/workflows/deploy.yml → deploy → smoke test → run demo`, { x: 1.3, y: 3.35, w: 10.7, h: 0.52, fontFace: "Consolas", fontSize: 10.6, color: "D7E7F6", margin: 0, fit: "shrink" });
  s.addText("Observability and deployment evidence turn the demo into an operational pattern.", { x: 1.3, y: 5.24, w: 10.6, h: 0.24, fontFace: "Segoe UI Semibold", fontSize: 13, color: C.navy, align: "center", margin: 0 });
  addNotes(s, "D7 gives operators evidence that the gateway is doing its job. D8 proves the environment is not a hand-built portal demo; it is Bicep deployed by GitHub Actions. Keep this concise in the live session because it is the bonus scenario.");
}

sectionSlide(++n, "Section 6", "Pricing, limits and choosing a tier", "65–75 · 10 min", "This section turns capabilities into implementation decisions. The price figures are list prices for US East in October 2026 and must be verified in the Azure pricing calculator before budgeting.", "06");

{
  const s = newSlide("Benefits"); n++;
  title(s, "Benefits: controls mapped to outcomes", n, "Pricing, limits & tiering");
  const benefits = [
    ["Governance", "One policy baseline for models, MCP tools and agents.", "Fewer exceptions"],
    ["Cost control / chargeback", "Token budgets, semantic caching and FinOps dashboards.", "Accountable spend"],
    ["Resiliency", "Backend pools, circuit breaker and retry absorb 429/5xx.", "Higher availability"],
    ["Security", "Managed identity, OAuth/JWT and content safety remove sprawl.", "Reduced risk"],
    ["Observability", "Token metrics and LLM logs explain usage and behavior.", "Better decisions"],
    ["Developer self-service", "Products, subscriptions, portal and API Center.", "Faster delivery"],
  ];
  benefits.forEach((b, i) => addCard(s, 0.72 + (i % 3) * 4.1, 1.18 + Math.floor(i / 3) * 2.05, 3.65, 1.37, b[0], `${b[1]}\nOutcome: ${b[2]}`, [C.teal, C.blue, C.amber][i % 3], String(i + 1), { bodySize: 8.9 }));
  s.addText("The gateway is an operating model, not just a network hop.", { x: 2.4, y: 5.75, w: 8.5, h: 0.35, fontFace: "Segoe UI Semibold", fontSize: 17, color: C.navy, align: "center", margin: 0 });
  addNotes(s, "This is the business value slide. Map each technical capability back to an operating outcome: fewer exceptions, accountable spend, higher availability, reduced risk, better decisions and faster delivery. This helps architects and decision makers justify the gateway pattern.");
}

{
  const s = newSlide("Pricing"); n++;
  title(s, "Pricing snapshot: list price, US East, Oct 2026", n, "Verify in calculator");
  const rows = [
    ["Tier", "Approx. price", "Included calls / notes", "AI gateway fit"],
    ["Consumption", "$0 base; ~1M free; $3.50/M overage", "No MCP, no circuit breaker", "Only simple model proxy"],
    ["Developer", "≈ $48/mo", "No SLA; classic slower deploy", "Lab fallback"],
    ["Basic / Basic v2", "≈ $147 / $150/mo", "Basic v2 includes 10M calls/unit; $3/M overage", "Demo sweet spot"],
    ["Standard / Standard v2", "≈ $687 / $700/mo", "Standard v2 includes 50M calls; VNet integration", "Production with isolated backends"],
    ["Premium / Premium v2", "≈ $2,795 / $2,800/unit/mo", "Premium v2 AZ + VNet injection + 30 units", "High scale / isolation"],
  ];
  const x0 = 0.65, y0 = 1.18, rowH = 0.62;
  const colW = [1.65, 2.7, 4.15, 3.55];
  rows.forEach((r, ri) => {
    let x = x0;
    r.forEach((cell, ci) => {
      const fill = ri === 0 ? C.navy : (ri === 3 ? C.paleTeal : C.white);
      s.addShape(SH.rect, { x, y: y0 + ri * rowH, w: colW[ci], h: rowH, fill: { color: fill }, line: { color: "D8E2EC", width: 0.6 } });
      s.addText(cell, {
        x: x + 0.08, y: y0 + ri * rowH + 0.12, w: colW[ci] - 0.16, h: 0.28,
        fontFace: ri === 0 ? "Segoe UI Semibold" : "Segoe UI",
        fontSize: ri === 0 ? 8.5 : 7.5,
        color: ri === 0 ? C.white : C.slate,
        bold: ri === 0,
        margin: 0,
        fit: "shrink",
      });
      x += colW[ci];
    });
  });
  s.addShape(SH.roundRect, { x: 0.86, y: 5.95, w: 11.65, h: 0.45, rectRadius: 0.06, fill: { color: C.paleAmber }, line: { color: C.paleAmber } });
  s.addText("List price, US East, Oct 2026 — verify in Azure pricing calculator. Model tokens are billed separately by Microsoft Foundry; APIM gateway does not add token cost.", { x: 1.05, y: 6.1, w: 11.25, h: 0.13, fontFace: "Segoe UI Semibold", fontSize: 8.6, color: C.navy, align: "center", margin: 0, fit: "shrink" });
  addNotes(s, "State the pricing disclaimer clearly. The table uses list prices from the research brief for US East in October 2026, and customers must verify in the pricing calculator for their subscription, region and agreement. Also make clear that model tokens are billed separately by Foundry.");
}

{
  const s = newSlide("Limits"); n++;
  title(s, "Limits to design around", n, "Pricing, limits & tiering");
  const limits = [
    ["Scale units", "Basic v2/Standard v2 up to 10; Premium v2 up to 30."],
    ["Policy size", "512 KiB policy document; Consumption is 16 KiB."],
    ["Payload & URL", "v2 buffered payload 2 MiB; request URL 16 KB."],
    ["Products / subscriptions", "Basic 200 products & 15K subscriptions; Standard 500 & 25K; Premium 2,000 & 75K."],
    ["Backend pool", "Up to 30 backends; one circuit-breaker rule per backend; not in Consumption."],
    ["MCP specifics", "Tools only; not in workspaces; not Consumption; do not read context.Response.Body in MCP policies."],
    ["Self-hosted gateway", "Developer and Premium classic only; not v2."],
    ["Token limits", "Per gateway, not aggregated across regions."],
  ];
  limits.forEach((l, i) => addCard(s, 0.72 + (i % 4) * 3.13, 1.2 + Math.floor(i / 4) * 2.05, 2.75, 1.38, l[0], l[1], i === 4 ? C.amber : C.teal, undefined, { bodySize: 8.2, headSize: 11.2, shadow: false }));
  s.addShape(SH.triangle, { x: 2.05, y: 5.66, w: 0.34, h: 0.28, fill: { color: C.amber }, line: { color: C.amber } });
  s.addText("Design implication: choose the SKU for features and limits first; then optimize cost.", { x: 2.52, y: 5.72, w: 8.7, h: 0.22, fontFace: "Segoe UI Semibold", fontSize: 12.2, color: C.navy, align: "left", margin: 0 });
  addNotes(s, "This is the constraint checklist. Do not read every number slowly; call out the limits that affect the demo and production designs: circuit breaker not in Consumption, MCP not in Consumption or workspaces, and self-hosted gateway not in v2. Remind the audience that token limits are per gateway.");
}

{
  const s = newSlide("Choosing a tier"); n++;
  title(s, "Choosing a tier for AI gateway scenarios", n, "Decision guide");
  const tiers = [
    ["Consumption", "Use when", "simple serverless proxy; no MCP or circuit breaker", "Avoid for", "this demo and most agent/tool gateway scenarios"],
    ["Basic v2", "Use when", "fast production-ready demo or entry gateway; supports MCP, policies and circuit breaker", "Avoid for", "VNet integration or high isolation"],
    ["Standard v2", "Use when", "production gateway with outbound VNet integration and higher included calls", "Avoid for", "full VNet injection or 30-unit scale"],
    ["Premium v2", "Use when", "availability zones, VNet injection and highest v2 scale are required", "Avoid for", "self-hosted gateway, which needs Developer or Premium classic"],
  ];
  tiers.forEach((t, i) => {
    const x = 0.72 + i * 3.15;
    s.addShape(SH.rect, { x, y: 1.25, w: 2.75, h: 4.05, fill: { color: i === 1 ? C.paleTeal : C.white }, line: { color: i === 1 ? C.teal : "D8E2EC", width: i === 1 ? 1.5 : 0.8 }, shadow: freshShadow(0.06) });
    s.addText(t[0], { x: x + 0.18, y: 1.52, w: 2.4, h: 0.28, fontFace: "Segoe UI Semibold", fontSize: 15, color: C.navy, align: "center", margin: 0 });
    addChip(s, x + 0.35, 2.1, t[1], C.paleBlue, C.navy, 0.82);
    s.addText(t[2], { x: x + 0.25, y: 2.48, w: 2.25, h: 0.82, fontFace: "Segoe UI", fontSize: 9.3, color: C.slate, align: "center", margin: 0.03, fit: "shrink" });
    addChip(s, x + 0.35, 3.62, t[3], C.paleAmber, C.navy, 0.82);
    s.addText(t[4], { x: x + 0.25, y: 4.0, w: 2.25, h: 0.78, fontFace: "Segoe UI", fontSize: 8.8, color: C.slate, align: "center", margin: 0.03, fit: "shrink" });
  });
  s.addText("For this repo: Basic v2 is the cheapest SKU that supports the full demo feature set.", { x: 1.9, y: 5.85, w: 9.6, h: 0.25, fontFace: "Segoe UI Semibold", fontSize: 13, color: C.navy, align: "center", margin: 0 });
  addNotes(s, "Walk through this as a decision slide rather than a product comparison matrix. Consumption is attractive but lacks MCP and circuit breaker for this scenario. Basic v2 is the demo choice because it supports the required AI gateway features at the lowest list price.");
}

sectionSlide(++n, "Section 7", "Patterns, reference architecture and labs", "75–82 · 7 min", "This divider transitions from the pricing decision into adoption. The goal is to give attendees a practical path and point them to the AI-Gateway lab catalog.", "07");

{
  const s = newSlide("Patterns and labs"); n++;
  title(s, "Adoption path: crawl, walk, run — backed by 50+ labs", n, "Patterns & labs");
  const phases = [
    ["Crawl", "Put one inference API behind APIM; use managed identity, subscription keys and basic token metrics.", C.teal],
    ["Walk", "Add token budgets, content safety, backend pools, circuit breakers and product-level chargeback.", C.blue],
    ["Run", "Register MCP servers and agents, API Center discovery, semantic caching and FinOps dashboards.", C.amber],
  ];
  phases.forEach((p, i) => {
    const x = 0.82 + i * 4.12;
    s.addShape(SH.chevron, { x, y: 1.25, w: 3.45, h: 1.05, fill: { color: p[2] }, line: { color: p[2] } });
    s.addText(p[0], { x: x + 0.32, y: 1.62, w: 2.7, h: 0.2, fontFace: "Segoe UI Semibold", fontSize: 15, color: p[2] === C.amber ? C.navy : C.white, align: "center", margin: 0 });
    s.addText(p[1], { x: x + 0.15, y: 2.65, w: 3.25, h: 0.82, fontFace: "Segoe UI", fontSize: 9.5, color: C.slate, align: "center", margin: 0.04, fit: "shrink" });
  });
  const labs = ["backend-pool-load-balancing", "token-rate-limiting", "content-safety", "mcp-from-api", "semantic-caching", "finops-framework", "zero-to-production"];
  s.addShape(SH.roundRect, { x: 1.0, y: 4.25, w: 11.35, h: 1.35, rectRadius: 0.07, fill: { color: C.white }, line: { color: "D8E2EC" }, shadow: freshShadow(0.06) });
  s.addText("AI-Gateway labs to try next", { x: 1.3, y: 4.55, w: 2.4, h: 0.18, fontFace: "Segoe UI Semibold", fontSize: 11.5, color: C.navy, margin: 0 });
  labs.forEach((lab, i) => addChip(s, 3.85 + (i % 4) * 2.05, 4.48 + Math.floor(i / 4) * 0.45, lab, i % 2 ? C.paleBlue : C.paleTeal, C.navy, 1.82));
  addNotes(s, "Give the audience a sequence. Crawl is about centralizing one model path; walk adds enforceable guardrails; run adds tools, agents, caching and FinOps. The Azure-Samples AI-Gateway repository has more than 50 labs, and the highlighted labs map directly to what they saw in the session.");
}

sectionSlide(++n, "Section 8", "Key takeaways, call to action and Q&A", "82–90 · 8 min", "This final divider sets up the close. Use the remaining minutes to reinforce the three big ideas, give links, and leave time for questions.", "08");

{
  const s = newSlide("Key takeaways"); n++;
  title(s, "Key takeaways", n, "Close");
  const takeaways = [
    ["One path", "APIM gives every AI app, MCP tool and agent a governed path."],
    ["Policy before spend", "Token budgets, safety and resiliency act before the backend call."],
    ["Evidence matters", "Token metrics and LLM logs turn AI operations into measurable platform work."],
    ["Start small", "Basic v2 is enough for this full demo; scale up when isolation and capacity require it."],
  ];
  takeaways.forEach((t, i) => addCard(s, 1.0 + (i % 2) * 5.65, 1.35 + Math.floor(i / 2) * 1.85, 5.0, 1.2, t[0], t[1], [C.teal, C.blue, C.amber, C.teal][i], String(i + 1), { bodySize: 10.2 }));
  s.addShape(SH.arc, { x: 5.58, y: 5.3, w: 2.1, h: 1.0, line: { color: C.teal, width: 5, transparency: 20 }, fill: { color: C.off, transparency: 100 } });
  s.addText("Make the gateway the default way to call AI.", { x: 2.4, y: 5.76, w: 8.6, h: 0.35, fontFace: "Segoe UI Semibold", fontSize: 18, color: C.navy, align: "center", margin: 0 });
  addNotes(s, "Close the narrative with four takeaways. The strongest message is that the gateway should become the default path for AI calls, not an optional layer. Reinforce that governance, cost control, safety, resiliency and observability are all easier when the traffic goes through one platform surface.");
}

{
  const s = newSlide("Call to action and Q&A", C.navy); n++;
  addGatewayArch(s, 9.1, 0.78, 2.75, 5.7, C.teal, 10);
  s.addText("Call to action", { x: 0.75, y: 0.95, w: 5.8, h: 0.5, fontFace: "Segoe UI Semibold", fontSize: 35, color: C.white, margin: 0 });
  const links = [
    ["Build", "aka.ms/ai-gateway\nor github.com/Azure-Samples/AI-Gateway"],
    ["Learn", "learn.microsoft.com/azure/api-management/genai-gateway-capabilities"],
    ["Explore", "azure.github.io/api-management-resources"],
  ];
  links.forEach((l, i) => addDarkCard(s, 0.82, 1.95 + i * 1.08, 7.15, 0.75, l[0], l[1], [C.teal, C.blue, C.amber][i]));
  s.addShape(SH.roundRect, { x: 8.55, y: 2.1, w: 2.35, h: 2.35, rectRadius: 0.12, fill: { color: C.teal }, line: { color: C.teal } });
  s.addText("Q&A", { x: 8.65, y: 2.95, w: 2.15, h: 0.36, fontFace: "Segoe UI Semibold", fontSize: 32, color: C.navy, align: "center", margin: 0 });
  s.addText("What would you centralize first?", { x: 7.75, y: 5.05, w: 4.0, h: 0.25, fontFace: "Segoe UI Semibold", fontSize: 14, color: "D7E7F6", align: "center", margin: 0 });
  s.addText(String(n).padStart(2, "0"), { x: 12.35, y: 6.95, w: 0.4, h: 0.18, fontFace: "Segoe UI Semibold", fontSize: 8, color: "AFC3DA", align: "right", margin: 0 });
  addNotes(s, "Point attendees to the labs and documentation. Ask what they would centralize first in their organization: model access, content safety, token budgets, MCP servers or observability. Then leave the remaining time for questions.");
}
function addDarkCard(slide, x, y, w, h, head, body, accent) {
  slide.addShape(SH.rect, { x, y, w, h, fill: { color: "102A52" }, line: { color: "25466F", width: 0.6 } });
  slide.addShape(SH.rect, { x, y, w: 0.08, h, fill: { color: accent }, line: { color: accent } });
  slide.addText(head, { x: x + 0.25, y: y + 0.17, w: 0.9, h: 0.15, fontFace: "Segoe UI Semibold", fontSize: 10.2, color: accent, margin: 0 });
  slide.addText(body, { x: x + 1.25, y: y + 0.17, w: w - 1.45, h: 0.22, fontFace: "Segoe UI", fontSize: 10.2, color: C.white, margin: 0, fit: "shrink" });
}

{
  const s = newSlide("Resources & sources"); n++;
  title(s, "Resources & sources", n, "Close");
  const sources = [
    ["APIM AI gateway capabilities", "learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities"],
    ["MCP server overview", "learn.microsoft.com/en-us/azure/api-management/mcp-server-overview"],
    ["AI-Gateway labs", "github.com/Azure-Samples/AI-Gateway"],
    ["APIM resources hub", "azure.github.io/api-management-resources"],
    ["Pricing", "azure.microsoft.com/pricing/details/api-management + Azure Retail Prices API"],
    ["Limits", "learn.microsoft.com/azure/azure-resource-manager/management/azure-subscription-service-limits#azure-api-management-limits"],
    ["Policies", "llm-token-limit, llm-content-safety, llm-emit-token-metric, authentication-managed-identity"],
    ["Research brief", "docs/research/apim-ai-gateway-research.md"],
  ];
  sources.forEach((src, i) => addCard(s, 0.72 + (i % 2) * 6.0, 1.1 + Math.floor(i / 2) * 1.22, 5.55, 0.78, src[0], src[1], i % 3 === 2 ? C.amber : C.teal, undefined, { bodySize: 7.9, headSize: 10.1, shadow: false }));
  s.addText("Facts in this deck are limited to the shared brief and research document; external pricing should be re-verified before customer use.", { x: 1.05, y: 6.13, w: 11.3, h: 0.18, fontFace: "Segoe UI Semibold", fontSize: 8.8, color: C.slate, align: "center", margin: 0, fit: "shrink" });
  addNotes(s, "Use this slide as the source appendix. Mention that the deck intentionally uses the shared brief and research document as its fact base. Remind presenters to re-verify pricing and model regional availability before using the material externally.");
}

async function main() {
  const out = path.resolve(__dirname, "..", "apim-ai-gateway-session.pptx");
  const maxSlides = Number(process.env.MAX_SLIDES || 0);
  if (maxSlides > 0 && maxSlides < slideTitles.length) {
    pptx._slides = pptx._slides.slice(0, maxSlides);
    slideTitles.length = maxSlides;
    speakerNotes.length = maxSlides;
  }
  await pptx.writeFile({ fileName: out });
  if (process.env.NO_NOTES !== "1") injectNotesWithPowerPoint(out);
  console.log(`Wrote ${out}`);
  console.log(`Slides: ${slideTitles.length}`);
  slideTitles.forEach((t, i) => console.log(`${String(i + 1).padStart(2, "0")}. ${t}`));
}
function injectNotesWithPowerPoint(fileName) {
  if (speakerNotes.length !== slideTitles.length) {
    throw new Error(`Expected ${slideTitles.length} note blocks, found ${speakerNotes.length}.`);
  }
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const tmpDir = path.join(repoRoot, "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  const notesPath = path.join(tmpDir, "apim-ai-gateway-notes.json");
  fs.writeFileSync(notesPath, JSON.stringify(speakerNotes, null, 2), "utf8");
  const esc = (s) => s.replace(/'/g, "''");
  const ps = `
$pptxPath = '${esc(fileName)}'
$notesPath = '${esc(notesPath)}'
$notes = Get-Content -Raw -Path $notesPath | ConvertFrom-Json
$pp = New-Object -ComObject PowerPoint.Application
try {
  $pres = $pp.Presentations.Open($pptxPath, $false, $false, $false)
  for ($i = 1; $i -le $notes.Count; $i++) {
    $slide = $pres.Slides.Item($i)
    $slide.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text = [string]$notes[$i - 1]
  }
  $pres.Save()
  $pres.Close()
} finally {
  if ($pres) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres) | Out-Null }
  $pp.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($pp) | Out-Null
}
`;
  execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps], { stdio: "inherit" });
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
