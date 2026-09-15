import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseArgs } from "node:util";
import { CONTRACT, environmentNamesFromList, validateExpected, verifyMetadata, probeSite, siteOrigin } from "./contract.mjs";

const exec = promisify(execFile);
const { values } = parseArgs({ options: {
  sha: { type: "string" }, ref: { type: "string" }, target: { type: "string" },
  deployment: { type: "string" }, browser: { type: "boolean", default: false },
  "main-sha": { type: "string" },
} });
const expected = { sha: values.sha, ref: values.ref, target: values.target, deploymentId: values.deployment, mainSha: values["main-sha"] };

// npm run supplies npm_execpath. Use Node + npm CLI, not a shell command with
// interpolated arguments. Offline only; cache miss is BLOCKED, never install.
async function api(endpoint) {
  const { stdout } = await cli(["api", endpoint, "--method", "GET", "--raw"]);
  return JSON.parse(stdout);
}

async function cli(command) {
  const npm = process.env.npm_execpath;
  if (!npm) throw new Error("Run via npm run ops:verify (existing authenticated CLI required)");
  const args = [npm, "exec", "--offline", "--yes", "--package=vercel@latest", "--", "vercel", ...command,
    "--scope", CONTRACT.teamId, "--non-interactive"];
  try {
    return await exec(process.execPath, args, { timeout: 30000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  } catch { throw new Error("Read-only Vercel API unavailable; check CLI session/cache/permissions manually. No login or retry performed."); }
}

try {
  validateExpected(expected);
  const deployment = await api(`/v13/deployments/${expected.deploymentId}`);
  const project = await api(`/v9/projects/${CONTRACT.projectId}`);
  const envList = await cli(["env", "ls", "--project", CONTRACT.projectId, "--no-color"]);
  const environmentNames = environmentNamesFromList(`${envList.stdout}\n${envList.stderr}`);
  const domainInventory = await api(`/v9/projects/${CONTRACT.projectId}/domains`);
  const customEnvironments = await api(`/v9/projects/${CONTRACT.projectId}/custom-environments`);
  const customEnvironmentNames = Array.isArray(customEnvironments.environments) ? customEnvironments.environments.map(e => e.slug).sort() : null;
  const canonicalAlias = await api(`/v4/aliases/${CONTRACT.canonical}`);
  if (!/^dpl_[a-zA-Z0-9]+$/.test(canonicalAlias.deploymentId ?? "")) throw new Error("Canonical alias deployment identity missing");
  const canonicalDeployment = canonicalAlias.deploymentId === deployment.id ? deployment : await api(`/v13/deployments/${canonicalAlias.deploymentId}`);
  const metadata = verifyMetadata({ deployment, project, environmentNames, domains: domainInventory.domains, customEnvironmentNames, canonicalAlias, canonicalDeployment }, expected);
  const report = { checkedAt: new Date().toISOString(), expected, metadata, http: { status: "NOT_RUN" }, browser: { status: "NOT_RUN" } };
  if (metadata.status === "PASS") {
    const origin = siteOrigin(expected.target === "production" ? CONTRACT.canonical : deployment.url);
    report.http = await probeSite(origin);
    if (values.browser && report.http.status === "PASS") {
      const { browserSmoke } = await import("./browser-smoke.mjs");
      report.browser = await browserSmoke(origin);
    }
  }
  report.status = metadata.status === "PASS" && report.http.status === "PASS" && (!values.browser || report.browser.status === "PASS") ? "PASS" : "BLOCKED";
  report.scope = values.browser ? "metadata + config + HTTP/assets + bounded browser" : "metadata + config + HTTP/assets; browser is a separate required release gate";
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.status === "PASS" ? 0 : 1;
} catch (error) {
  // Do not serialize subprocess stderr/stdout, tokens, cookies, or raw responses.
  console.error(JSON.stringify({ status: "BLOCKED", reason: "Verification failed; check expected arguments, authenticated CLI and local browser availability. No mutation/retry performed.", errorType: error.name }));
  process.exitCode = 1;
}
