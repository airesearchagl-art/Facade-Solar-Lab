import { describe, expect, it } from "vitest";
import { CONTRACT, deploymentSnapshot, deploymentTarget, environmentNamesFromList, indexAssets, probeSite, projectSnapshot, siteOrigin, validateExpected, verifyMetadata } from "../scripts/ops/contract.mjs";

const mainSha = "a".repeat(40), head = "b".repeat(40);
const settings = { framework: "vite", nodeVersion: "24.x", rootDirectory: null, buildCommand: null, outputDirectory: null, installCommand: null };
function fixture(target = "preview") {
  const meta = { githubCommitOrg: CONTRACT.owner, githubCommitRepo: CONTRACT.repo, githubCommitRepoId: CONTRACT.repoId, githubCommitRef: "main", githubCommitSha: mainSha };
  const canonicalDeployment = { id: "dpl_Production", projectId: CONTRACT.projectId, name: CONTRACT.name, source: "git", target: "production", readyState: "READY", meta, alias: [CONTRACT.canonical], aliasAssigned: true, projectSettings: { ...settings } };
  const deployment = target === "production" ? structuredClone(canonicalDeployment) : { ...structuredClone(canonicalDeployment), id: "dpl_Preview", target: null, customEnvironment: null, meta: { ...meta, githubCommitRef: "feat/m6-vercel-operation", githubCommitSha: head }, alias: ["facade-solar-lab-git-feature.vercel.app"] };
  const project = { ...settings, id: CONTRACT.projectId, name: CONTRACT.name, accountId: CONTRACT.teamId, link: { type: "github", org: CONTRACT.owner, repo: CONTRACT.repo, repoId: Number(CONTRACT.repoId), productionBranch: "main" }, gitProviderOptions: { createDeployments: "enabled" }, ssoProtection: { deploymentType: "all_except_custom_domains" }, env: [] };
  for (const d of [canonicalDeployment, deployment]) d.gitSource = { type: "github", sha: d.meta.githubCommitSha, ref: d.meta.githubCommitRef, repoId: Number(CONTRACT.repoId) };
  const expected = { deploymentId: deployment.id, sha: deployment.meta.githubCommitSha, ref: deployment.meta.githubCommitRef, target, mainSha };
  return { raw: { deployment, project, environmentNames: [], customEnvironmentNames: [], domains: [{ name: CONTRACT.canonical, verified: true }], canonicalDeployment, canonicalAlias: { alias: CONTRACT.canonical, projectId: CONTRACT.projectId, deploymentId: canonicalDeployment.id } }, expected };
}
const html = '<html><head><title>Facade Solar Lab</title><script type="module" src="/assets/index-a.js"></script><link rel="stylesheet" href="/assets/index-b.css"></head><body><div id="root"></div></body></html>';
const origin = "https://facade-solar-lab.vercel.app";
const fakeFetch = (edit = () => {}) => async (url, options) => {
  expect(options.redirect).toBe("manual");
  const response = { status: 200, type: url.endsWith(".css") ? "text/css" : url.endsWith(".js") ? "text/javascript" : "text/html", text: url.endsWith("/") ? html : "/* asset */" };
  edit(response, url);
  return new Response(response.text, { status: response.status, headers: { "content-type": response.type } });
};

describe("M6 operational provenance contract (mock metadata, not live deployment evidence)", () => {
  it.each(["preview", "production"])("accepts exact %s and same canonical main", target => {
    const f = fixture(target); expect(verifyMetadata(f.raw, f.expected).status).toBe("PASS");
  });
  it.each([
    ["sha", "c".repeat(40)], ["ref", "other-branch"],
    ["deploymentId", "dpl_Other"], ["mainSha", "c".repeat(40)],
  ])("fails closed for expected %s mismatch", (key, value) => {
    const f = fixture(); f.expected[key] = value;
    expect(verifyMetadata(f.raw, f.expected).status).toBe("BLOCKED");
  });
  it.each([["sha", "short"], ["target", "staging"]])("rejects invalid expected %s", (key, value) => {
    const f = fixture(); f.expected[key] = value;
    expect(() => verifyMetadata(f.raw, f.expected)).toThrow();
  });
  it("rejects a conflicting temporary merge SHA even when display metadata matches", () => {
    const f = fixture(); f.raw.deployment.gitSource.sha = "c".repeat(40);
    expect(verifyMetadata(f.raw, f.expected).status).toBe("BLOCKED");
  });
  it("requires explicit empty env inventory, not an omitted project env field", () => {
    expect(environmentNamesFromList("> No Environment Variables found for airesearchagls-projects/facade-solar-lab [171ms]\n")).toEqual([]);
    for (const text of ["", "> No Environment Variables found for other/project", "NAME Encrypted Production"]) expect(environmentNamesFromList(text)).toBeNull();
    for (const names of [null, ["NEW_NAME"]]) {
      const f = fixture(); f.raw.environmentNames = names;
      expect(verifyMetadata(f.raw, f.expected).status).toBe("BLOCKED");
    }
  });
  it.each([
    ["source", "cli"], ["target", "production"], ["readyState", "BUILDING"], ["readyState", "ERROR"],
    ["projectId", "prj_Other"], ["name", "other"], ["customEnvironment", { slug: "staging" }],
  ])("rejects deployment %s drift", (key, value) => {
    const f = fixture(); f.raw.deployment[key] = value;
    expect(verifyMetadata(f.raw, f.expected).status).toBe("BLOCKED");
  });
  it.each(["githubCommitOrg", "githubCommitRepo", "githubCommitRepoId", "githubCommitRef", "githubCommitSha"])("rejects missing %s (no fallback to temporary merge SHA)", key => {
    const f = fixture(); delete f.raw.deployment.meta[key];
    f.raw.deployment.gitSource = { sha: f.expected.sha };
    expect(verifyMetadata(f.raw, f.expected).status).toBe("BLOCKED");
  });
  it.each([
    ["accountId", "team_other"], ["framework", "nextjs"], ["nodeVersion", "22.x"],
    ["rootDirectory", "other"], ["buildCommand", "echo ok"], ["outputDirectory", "out"],
    ["installCommand", "custom"], ["previewDeploymentsDisabled", true],
    ["ssoProtection", null], ["passwordProtection", { value: "must-not-output" }], ["trustedIps", {}],
  ])("detects project configuration drift: %s", (key, value) => {
    const f = fixture(); f.raw.project[key] = value; expect(verifyMetadata(f.raw, f.expected).status).toBe("BLOCKED");
  });
  it("detects per-deployment overrides independently of project defaults", () => {
    const f = fixture(); f.raw.deployment.projectSettings.outputDirectory = "other";
    expect(verifyMetadata(f.raw, f.expected).status).toBe("BLOCKED");
  });
  it("blocks unverified/redirected domains and added custom environments", () => {
    for (const mutate of [f => f.raw.domains[0].verified = false, f => f.raw.domains[0].redirect = "example.com", f => f.raw.domains.push({ name: "example.com" }), f => f.raw.customEnvironmentNames.push("staging"), f => delete f.raw.domains]) {
      const f = fixture(); mutate(f); expect(verifyMetadata(f.raw, f.expected).status).toBe("BLOCKED");
    }
  });
  it("distinguishes omitted target, custom environment and built-in null Preview", () => {
    expect(deploymentTarget({})).toBe("unknown");
    expect(deploymentTarget({ target: null })).toBe("preview");
    expect(deploymentTarget({ target: null, customEnvironment: { slug: "preview" } })).toBe("custom");
    const f = fixture(); delete f.raw.deployment.target;
    expect(verifyMetadata(f.raw, f.expected).status).toBe("BLOCKED");
  });
  it.each(["preview", "production"])("detects canonical drift for %s", target => {
    const f = fixture(target); f.raw.canonicalAlias.deploymentId = "dpl_Old";
    expect(verifyMetadata(f.raw, f.expected).status).toBe("BLOCKED");
  });
  it("does not accept stale main, non-main Production or canonical alias on a Preview", () => {
    for (const mutate of [f => f.raw.canonicalDeployment.meta.githubCommitSha = head, f => f.raw.canonicalDeployment.meta.githubCommitRef = "other", f => f.raw.deployment.alias.push(CONTRACT.canonical)]) {
      const f = fixture(); mutate(f); expect(verifyMetadata(f.raw, f.expected).status).toBe("BLOCKED");
    }
  });
  it("sanitizes raw responses and never serializes secrets/author data", () => {
    const f = fixture(); f.raw.project.env = [{ key: "NAME_ONLY", value: "SECRET_VALUE" }];
    f.raw.project.protectionBypass = { SECRET_BYPASS: true };
    f.raw.deployment.meta.githubCommitAuthorEmail = "PRIVATE_EMAIL";
    const output = JSON.stringify([projectSnapshot(f.raw.project, ["NAME_ONLY"]), deploymentSnapshot(f.raw.deployment)]);
    expect(output).toContain("NAME_ONLY"); expect(output).not.toMatch(/SECRET_VALUE|SECRET_BYPASS|PRIVATE_EMAIL/);
  });
  it("rejects shell metacharacters and invalid target/ref relationships", () => {
    for (const change of [{ ref: "a&echo" }, { ref: "main" }, { target: "production" }, { deploymentId: "dpl_a/../b" }]) expect(() => validateExpected({ ...fixture().expected, ...change })).toThrow();
  });
});

describe("M6 bounded HTTP and asset gate", () => {
  it("resolves only the static product's same-origin referenced JS/CSS", () => {
    expect(indexAssets(html, origin)).toEqual([`${origin}/assets/index-a.js`, `${origin}/assets/index-b.css`]);
  });
  it.each(["https://attacker.test/x.js", "//attacker.test/x.js", "/assets/x.js?token=hidden", "/other.js"])("rejects unsupported/external asset %s", path => {
    expect(() => indexAssets(html.replace("/assets/index-a.js", path), origin)).toThrow();
  });
  it("rejects login HTML, missing JS/CSS, and unexpected hosts", () => {
    expect(() => indexAssets("<title>Login</title>", origin)).toThrow();
    expect(() => indexAssets('<title>Facade Solar Lab</title><div id="root"></div>', origin)).toThrow();
    for (const host of ["evil.test", "facade-solar-lab.vercel.app.evil.test", "facade-solar-lab.vercel.app/path", "user@facade-solar-lab.vercel.app"]) expect(() => siteOrigin(host)).toThrow();
  });
  it("accepts HTTP 200 with product index, nonempty JS and CSS MIME", async () => {
    const r = await probeSite(origin, fakeFetch()); expect(r.status).toBe("PASS"); expect(r.assets).toHaveLength(2);
  });
  it("checks the explicit favicon as an asset instead of ignoring its failure", async () => {
    const fetcher = failure => fakeFetch((r, url) => {
      if (url.endsWith("/")) r.text = html.replace("<head>", '<head><link rel="icon" href="/favicon.svg">');
      if (url.endsWith(".svg")) { r.type = "image/svg+xml"; r.status = failure ? 404 : 200; }
    });
    expect((await probeSite(origin, fetcher(false))).status).toBe("PASS");
    expect((await probeSite(origin, fetcher(true))).status).toBe("BLOCKED");
  });
  it.each([302, 401, 403, 404, 500])("does not follow redirect or accept index HTTP %d", async status => {
    const r = await probeSite(origin, fakeFetch(r => { r.status = status; }));
    expect(r.status).toBe("BLOCKED"); expect(r.assets).toEqual([]);
  });
  it.each(["404", "html", "empty"])("blocks invalid asset: %s", async failure => {
    const r = await probeSite(origin, fakeFetch((r, url) => { if (url.endsWith(".js")) { if (failure === "404") r.status = 404; if (failure === "html") r.type = "text/html"; if (failure === "empty") r.text = ""; } }));
    expect(r.status).toBe("BLOCKED");
  });
  it("rejects oversized index instead of reading unbounded data", async () => {
    await expect(probeSite(origin, fakeFetch(r => { r.text = "x".repeat(512 * 1024 + 1); }))).rejects.toThrow(/budget/);
  });
  it("network failure cannot become PASS", async () => {
    await expect(probeSite(origin, async () => { throw new Error("offline"); })).rejects.toThrow();
  });
});
