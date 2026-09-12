import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const sourceUrl = new URL("../legacy/mvp-v0.1/solar_overhang_simulator.html", import.meta.url);
const fixtureUrl = new URL("../tests/fixtures/legacy-v01-golden.json", import.meta.url);
const expectedSourceSha256 =
  "EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5";
const startMarker = "const ASHRAE=";
const endMarker = "// ================= 描画";

const sourceBytes = await readFile(sourceUrl);
const sourceSha256 = createHash("sha256").update(sourceBytes).digest("hex").toUpperCase();

if (sourceSha256 !== expectedSourceSha256) {
  throw new Error(
    `Legacy source hash mismatch: expected ${expectedSourceSha256}, received ${sourceSha256}`,
  );
}

const html = sourceBytes.toString("utf8");
const calculationStart = html.indexOf(startMarker);
const calculationEnd = html.indexOf(endMarker, calculationStart);

if (calculationStart < 0 || calculationEnd < 0) {
  throw new Error("Unable to locate the original legacy calculation block");
}

const calculationSource = html.slice(calculationStart, calculationEnd);
const context = vm.createContext({ Math });
const referenceScript = new vm.Script(
  `${calculationSource}\n` +
    "globalThis.__legacyReference = { decl, hourGain, simulate, summarize };",
  { filename: fileURLToPath(sourceUrl) },
);
referenceScript.runInContext(context);

const reference = context.__legacyReference;
if (!reference) {
  throw new Error("Original legacy calculation block did not expose the reference functions");
}

const defaults = Object.freeze({
  H: 2.4,
  D: 1.6,
  O: 0.3,
  W: 6,
  lat: 35.2,
  surfAz: 0,
  eta: 1,
  rho: 0.2,
  sky: 2,
});

const cases = [
  { id: "G1_DEFAULT", parameters: defaults },
  { id: "G2_NO_OVERHANG", parameters: { ...defaults, D: 0 } },
  { id: "G3_AZIMUTH_NEGATIVE_30", parameters: { ...defaults, surfAz: -30 } },
  { id: "G3_AZIMUTH_POSITIVE_30", parameters: { ...defaults, surfAz: 30 } },
  { id: "G4_WIDTH_HALF", parameters: { ...defaults, W: 3 } },
  { id: "G5_ETA_HALF", parameters: { ...defaults, eta: 0.5 } },
  {
    id: "G6_DH_OH_SIMILARITY_HALF_HEIGHT",
    parameters: { ...defaults, H: 1.2, D: 0.8, O: 0.15 },
  },
  {
    id: "G6_DH_ONLY_FIXED_O_UNSCALED",
    parameters: { ...defaults, H: 1.2, D: 0.8, O: 0.3 },
  },
].map(({ id, parameters }) => {
  const monthly = reference.simulate(parameters);
  return {
    id,
    parameters,
    monthly,
    summary: reference.summarize(monthly),
  };
});

const fixture = {
  schemaVersion: 1,
  provenance: {
    sourcePath: "legacy/mvp-v0.1/solar_overhang_simulator.html",
    sourceSha256,
    extraction: {
      startMarker,
      endMarker,
      method: "Node.js vm execution of the original calculation block",
    },
    generator: "scripts/generate-legacy-v01-golden.mjs",
  },
  cases,
};

const renderedFixture = `${JSON.stringify(fixture, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const committedFixture = await readFile(fixtureUrl, "utf8");
  if (committedFixture !== renderedFixture) {
    throw new Error("Golden fixture is stale; regenerate it from the original legacy source");
  }
  console.log(`Golden fixture verified against ${sourceSha256}`);
} else {
  await writeFile(fixtureUrl, renderedFixture, "utf8");
  console.log(`Golden fixture generated from ${sourceSha256}`);
}
