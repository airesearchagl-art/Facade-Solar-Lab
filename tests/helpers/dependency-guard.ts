const forbiddenGlobals = new Set([
  "window", "document", "navigator", "localStorage", "sessionStorage",
  "fetch", "XMLHttpRequest", "WebSocket", "Worker", "Image", "File", "FileReader", "Blob",
  "CanvasRenderingContext2D", "OffscreenCanvas", "OffscreenCanvasRenderingContext2D",
  "CanvasGradient", "CanvasPattern", "Path2D", "ImageData", "Element", "HTMLElement",
  "Document", "Node", "DOMParser", "DOMException", "URL", "URLSearchParams",
  "process", "Buffer", "NodeJS", "Deno", "Bun", "Date",
]);

/** Conservative lexical policy: relative modules only, no environment globals.
 * This is a regression guard, not a complete TS parser or a security sandbox.
 * Literal templates are ignored; interpolated templates are scanned separately.
 */
export function dependencyFindings(source: string): { findings: string[]; relativeModules: string[] } {
  const findings: string[] = [];
  const relativeModules: string[] = [];
  const tokens = source.match(/\/\/[^\n\r]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|[$\w]+|[^\s]/gu)?.filter(t => !t.startsWith("//") && !t.startsWith("/*")) ?? [];
  const isString = (token: string) => /^["']/u.test(token);
  function module(token: string | undefined) {
    if (!token || !isString(token) || token.includes("\\")) {
      findings.push("computed module specifier");
      return;
    }
    const value = token.slice(1, -1);
    if (!value.startsWith("./") && !value.startsWith("../")) findings.push(`external dependency: ${value}`);
    else relativeModules.push(value);
  }
  for (const [i, token] of tokens.entries()) {
    if (token.startsWith("`")) {
      for (const expression of token.matchAll(/\$\{([^}]*)\}/gu)) {
        const nested = dependencyFindings(expression[1]!);
        findings.push(...nested.findings);
        relativeModules.push(...nested.relativeModules);
      }
      continue;
    }
    if (isString(token)) continue;
    if (forbiddenGlobals.has(token) || /^(?:HTML|SVG).*Element$/u.test(token)) findings.push(`environment identifier: ${token}`);
    if (["globalThis", "self", "global", "eval", "Function"].includes(token)) findings.push(`environment access: ${token}`);
    if (token === "from" && isString(tokens[i + 1] ?? "")) module(tokens[i + 1]);
    if (token === "import" && isString(tokens[i + 1] ?? "")) module(tokens[i + 1]);
    if (["import", "require"].includes(token) && tokens[i + 1] === "(") module(tokens[i + 2]);
  }
  return { findings: [...new Set(findings)], relativeModules };
}

export function resolveCoreModule(from: string, relative: string): string {
  const parts = from.split("/").slice(0, -1);
  for (const part of relative.split("/")) {
    if (part === "..") parts.pop(); else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
}
