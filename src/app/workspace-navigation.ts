export const WORKSPACE_MODES = ["single", "multi", "guide"] as const;

export type WorkspaceMode = (typeof WORKSPACE_MODES)[number];

/**
 * Hash-only navigation keeps the app deployable as one static Vite document.
 * Guide subsection anchors intentionally share the `guide-` prefix.
 */
export function workspaceModeFromHash(hash: string): WorkspaceMode {
  const normalized = hash.trim().toLowerCase();
  if (normalized === "#multi") return "multi";
  if (normalized === "#guide" || normalized.startsWith("#guide-")) return "guide";
  return "single";
}

export function workspaceHash(mode: WorkspaceMode): `#${WorkspaceMode}` {
  return `#${mode}`;
}
