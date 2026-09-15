// Operational checks only. No product/calculation imports; no credentials.
export const CONTRACT = Object.freeze({
  projectId: "prj_IFtMR3MoADBBYm4YjLuXQ2BmcaN6",
  teamId: "team_44GttBgV6NXj8jDRnTiI3nXt",
  name: "facade-solar-lab",
  owner: "airesearchagl-art",
  repo: "Facade-Solar-Lab",
  repoId: "1367124737",
  productionRef: "main",
  canonical: "facade-solar-lab.vercel.app",
  framework: "vite",
  nodeVersion: "24.x",
});

export function validateExpected(expected) {
  if (!/^[a-f0-9]{40}$/.test(expected.sha ?? "")) throw new Error("Expected full lowercase Git SHA required");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/.test(expected.ref ?? "")) throw new Error("Expected Git ref required");
  if (!["preview", "production"].includes(expected.target)) throw new Error("Explicit preview or production required");
  if ((expected.target === "production") !== (expected.ref === CONTRACT.productionRef)) throw new Error("Production must use main; Preview must not use main");
  if (!/^dpl_[a-zA-Z0-9]+$/.test(expected.deploymentId ?? "")) throw new Error("Exact deployment ID required");
  if (!/^[a-f0-9]{40}$/.test(expected.mainSha ?? "")) throw new Error("Expected current main SHA required");
  if (expected.target === "production" && expected.mainSha !== expected.sha) throw new Error("Production SHA must equal merged main SHA");
}

export function deploymentTarget(deployment) {
  // Missing target is UNKNOWN, never implicit Preview. Vercel's built-in Preview
  // uses target:null; a custom environment must not be mistaken for Preview.
  if (deployment.customEnvironment != null) return "custom";
  if (deployment.target === "production") return "production";
  if (Object.hasOwn(deployment, "target") && [null, "preview"].includes(deployment.target)) return "preview";
  return "unknown";
}

export function deploymentSnapshot(d) {
  const m = d.meta ?? {};
  return {
    id: d.id, projectId: d.projectId, name: d.name, url: d.url,
    source: d.source, target: deploymentTarget(d), rawTarget: d.target,
    state: d.readyState, sha: m.githubCommitSha, ref: m.githubCommitRef,
    owner: m.githubCommitOrg, repo: m.githubCommitRepo, repoId: String(m.githubCommitRepoId ?? ""),
    aliases: Array.isArray(d.alias) ? d.alias : [], aliasAssigned: d.aliasAssigned === true,
  };
}

export function environmentNamesFromList(text) {
  // CLI list prints names/metadata only, never values. A different CLI format or
  // a nonempty inventory is UNKNOWN, not an inferred empty set. Fail closed.
  return /^> No Environment Variables found for airesearchagls-projects\/facade-solar-lab(?: \[\d+ms\])?\s*$/m.test(text) ? [] : null;
}

export function projectSnapshot(p, environmentNames = null) {
  // Whitelist only. Never serialize env values, bypass records, passwords,
  // author email, Git messages, or the complete API response.
  return {
    id: p.id, name: p.name, teamId: p.accountId, framework: p.framework,
    rootDirectory: p.rootDirectory ?? null, buildCommand: p.buildCommand ?? null,
    outputDirectory: p.outputDirectory ?? null, installCommand: p.installCommand ?? null,
    nodeVersion: p.nodeVersion, gitType: p.link?.type, owner: p.link?.org,
    repo: p.link?.repo, repoId: String(p.link?.repoId ?? ""), productionRef: p.link?.productionBranch,
    createDeployments: p.gitProviderOptions?.createDeployments,
    previewDeploymentsDisabled: p.previewDeploymentsDisabled ?? null,
    ssoDeploymentType: p.ssoProtection?.deploymentType ?? null,
    passwordProtectionPresent: p.passwordProtection != null,
    trustedIpsPresent: p.trustedIps != null,
    environmentNames,
  };
}

export function verifyMetadata(raw, expected) {
  validateExpected(expected);
  const d = deploymentSnapshot(raw.deployment), p = projectSnapshot(raw.project, raw.environmentNames ?? null);
  const checks = [];
  const equal = (name, actual, wanted) => checks.push({ name, pass: actual === wanted });
  equal("deployment.id", d.id, expected.deploymentId);
  equal("deployment.project", d.projectId, CONTRACT.projectId);
  equal("deployment.name", d.name, CONTRACT.name);
  equal("deployment.source", d.source, "git");
  equal("deployment.sha", d.sha, expected.sha);
  equal("deployment.ref", d.ref, expected.ref);
  equal("deployment.target", d.target, expected.target);
  equal("deployment.READY", d.state, "READY");
  equal("deployment.repo", d.repo, CONTRACT.repo);
  equal("deployment.owner", d.owner, CONTRACT.owner);
  equal("deployment.repoId", d.repoId, CONTRACT.repoId);
  for (const [key, wanted] of [["type", "github"], ["sha", expected.sha], ["ref", expected.ref], ["repoId", CONTRACT.repoId]]) {
    equal(`deployment.gitSource.${key}`, String(raw.deployment.gitSource?.[key] ?? ""), wanted);
  }
  equal("project.id", p.id, CONTRACT.projectId);
  equal("project.team", p.teamId, CONTRACT.teamId);
  equal("project.name", p.name, CONTRACT.name);
  equal("project.gitType", p.gitType, "github");
  equal("project.owner", p.owner, CONTRACT.owner);
  equal("project.repo", p.repo, CONTRACT.repo);
  equal("project.repoId", p.repoId, CONTRACT.repoId);
  equal("project.productionRef", p.productionRef, CONTRACT.productionRef);
  equal("project.gitDeployments", p.createDeployments, "enabled");
  equal("project.framework", p.framework, CONTRACT.framework);
  equal("project.node", p.nodeVersion, CONTRACT.nodeVersion);
  // Inventory baseline: null = framework defaults, not an explicit command.
  for (const key of ["rootDirectory", "buildCommand", "outputDirectory", "installCommand", "previewDeploymentsDisabled"]) equal(`config.${key}`, p[key], null);
  equal("config.sso", p.ssoDeploymentType, "all_except_custom_domains");
  equal("config.passwordProtection", p.passwordProtectionPresent, false);
  equal("config.trustedIps", p.trustedIpsPresent, false);
  equal("config.environmentNames", JSON.stringify(p.environmentNames), "[]");
  equal("config.customEnvironments", JSON.stringify(raw.customEnvironmentNames), "[]");
  equal("config.domains", JSON.stringify(raw.domains?.map(domain => ({ name: domain.name, verified: domain.verified, gitBranch: domain.gitBranch ?? null, redirect: domain.redirect ?? null }))), JSON.stringify([{ name: CONTRACT.canonical, verified: true, gitBranch: null, redirect: null }]));
  for (const key of ["framework", "nodeVersion", "rootDirectory", "buildCommand", "outputDirectory", "installCommand"]) {
    equal(`deployment.settings.${key}`, raw.deployment.projectSettings?.[key] ?? null, p[key]);
  }
  equal("alias.canonicalName", raw.canonicalAlias?.alias, CONTRACT.canonical);
  equal("alias.project", raw.canonicalAlias?.projectId, CONTRACT.projectId);
  const canonicalId = raw.canonicalAlias?.deploymentId;
  const production = deploymentSnapshot(raw.canonicalDeployment ?? {});
  equal("canonical.id", production.id, canonicalId);
  equal("canonical.project", production.projectId, CONTRACT.projectId);
  equal("canonical.source", production.source, "git");
  equal("canonical.target", production.target, "production");
  equal("canonical.READY", production.state, "READY");
  equal("canonical.sha", production.sha, expected.mainSha);
  equal("canonical.ref", production.ref, CONTRACT.productionRef);
  equal("canonical.repo", production.repo, CONTRACT.repo);
  equal("canonical.owner", production.owner, CONTRACT.owner);
  equal("canonical.repoId", production.repoId, CONTRACT.repoId);
  for (const [key, wanted] of [["type", "github"], ["sha", expected.mainSha], ["ref", "main"], ["repoId", CONTRACT.repoId]]) {
    equal(`canonical.gitSource.${key}`, String(raw.canonicalDeployment?.gitSource?.[key] ?? ""), wanted);
  }
  if (expected.target === "production") {
    equal("alias.currentProduction", canonicalId, d.id);
    equal("alias.assigned", d.aliasAssigned, true);
    equal("alias.deploymentMembership", d.aliases.includes(CONTRACT.canonical), true);
  } else {
    equal("alias.previewIsNotProduction", typeof canonicalId === "string" && canonicalId !== d.id, true);
    equal("alias.noCanonicalOnPreview", d.aliases.includes(CONTRACT.canonical), false);
  }
  return { status: checks.every(c => c.pass) ? "PASS" : "BLOCKED", checks, deployment: d, project: p };
}

export function siteOrigin(host) {
  if (typeof host !== "string" || !/^(?:facade-solar-lab|facade-solar-[a-z0-9-]+)\.vercel\.app$/.test(host)) throw new Error("Unexpected deployment hostname");
  return `https://${host}`;
}

export function indexAssets(html, origin) {
  if (!/<title>\s*Facade Solar Lab\s*<\/title>/i.test(html) || !/id=["']root["']/.test(html)) throw new Error("Product index not found (login/error page is not PASS)");
  const assets = [];
  for (const tag of html.match(/<(?:script|link)\b[^>]*>/gi) ?? []) {
    const script = /^<script/i.test(tag);
    if (!script && !/\brel=["'](?:stylesheet|modulepreload|icon)["']/i.test(tag)) continue;
    const match = tag.match(script ? /\bsrc=["']([^"']+)["']/i : /\bhref=["']([^"']+)["']/i);
    if (!match) continue;
    const url = new URL(match[1], origin);
    if (url.origin !== origin || url.search || url.hash || !/^(?:\/assets\/[\w.-]+\.(?:m?js|css)|\/favicon\.svg)$/.test(url.pathname)) throw new Error("Unexpected asset URL; do not send credentials or follow external assets");
    assets.push(url.href);
    if (assets.length > 64) throw new Error("Asset count exceeds bounded smoke budget");
  }
  if (!assets.some(u => /\.m?js$/.test(u)) || !assets.some(u => /\.css$/.test(u))) throw new Error("Expected JS and CSS references missing");
  return [...new Set(assets)];
}

export async function probeSite(origin, fetcher = fetch) {
  const request = async (url, maxBytes) => {
    const response = await fetcher(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
    const type = response.headers.get("content-type") ?? "";
    if (response.status !== 200) { await response.body?.cancel(); return { status: response.status, type }; }
    const reader = response.body.getReader();
    let bytes = 0; const parts = [];
    try {
      for (;;) {
        const next = await reader.read(); if (next.done) break;
        bytes += next.value.byteLength;
        if (bytes > maxBytes) throw new Error("Response exceeds bounded smoke budget");
        parts.push(next.value);
      }
    } finally { await reader.cancel(); }
    return { status: 200, type, text: new TextDecoder().decode(Buffer.concat(parts)), bytes };
  };
  const index = await request(`${origin}/`, 512 * 1024);
  if (index.status !== 200) return { status: "BLOCKED", reason: [301, 302, 303, 307, 308, 401, 403].includes(index.status) ? "HTTP_AUTH_OR_REDIRECT" : "HTTP_ERROR", indexStatus: index.status, assets: [] };
  if (!/text\/html/i.test(index.type)) throw new Error("Index MIME mismatch");
  const urls = indexAssets(index.text, origin);
  const assets = [];
  for (const url of urls) {
    const asset = await request(url, 2 * 1024 * 1024);
    const validType = /\.css$/.test(url) ? /text\/css/i.test(asset.type) : /\.svg$/.test(url) ? /image\/svg\+xml/i.test(asset.type) : /(?:javascript|ecmascript)/i.test(asset.type);
    assets.push({ path: new URL(url).pathname, status: asset.status, mimePass: validType, nonempty: asset.bytes > 0 });
  }
  return { status: assets.every(a => a.status === 200 && a.mimePass && a.nonempty) ? "PASS" : "BLOCKED", indexStatus: 200, title: "Facade Solar Lab", assets };
}
