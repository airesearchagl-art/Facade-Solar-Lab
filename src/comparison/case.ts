import type { FacadeV1Parameters } from "../engine/facade-v1";
import type { ComparisonCase, ComparisonWorkspace } from "./types";

export const MIN_COMPARISON_CASES = 1;
export const MAX_COMPARISON_CASES = 4;

export const DEFAULT_COMPARISON_PARAMETERS: FacadeV1Parameters = Object.freeze({
  facadeAzimuthDegFromNorth: 180,
  opening: Object.freeze({
    centerXM: 0,
    widthM: 6,
    sillZM: 0.9,
    headZM: 3.3,
  }),
  overhang: Object.freeze({
    depthM: 0.8,
    elevationZM: 3.6,
    leftExtensionM: 0.5,
    rightExtensionM: 0.5,
  }),
  solarHeatGainCoefficient: 0.5,
  groundReflectance: 0.2,
});

export function cloneFacadeV1Parameters(
  parameters: FacadeV1Parameters,
): FacadeV1Parameters {
  return {
    facadeAzimuthDegFromNorth: parameters.facadeAzimuthDegFromNorth,
    opening: { ...parameters.opening },
    ...(parameters.overhang === undefined
      ? {}
      : { overhang: { ...parameters.overhang } }),
    solarHeatGainCoefficient: parameters.solarHeatGainCoefficient,
    groundReflectance: parameters.groundReflectance,
  };
}

function requireText(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed === "") throw new RangeError(`${label} must not be empty`);
  return trimmed;
}

export function createComparisonCase(
  id: string,
  name: string,
  parameters: FacadeV1Parameters = DEFAULT_COMPARISON_PARAMETERS,
): ComparisonCase {
  return {
    id: requireText(id, "case id"),
    name: requireText(name, "case name"),
    parameters: cloneFacadeV1Parameters(parameters),
  };
}

export function createComparisonWorkspace(
  initialCase: ComparisonCase = createComparisonCase("case-a", "Case A"),
): ComparisonWorkspace {
  return { cases: [initialCase], baselineCaseId: initialCase.id };
}

export function addComparisonCase(
  workspace: ComparisonWorkspace,
  nextCase: ComparisonCase,
): ComparisonWorkspace {
  if (workspace.cases.length >= MAX_COMPARISON_CASES) {
    throw new RangeError(`Comparison supports at most ${MAX_COMPARISON_CASES} cases`);
  }
  if (workspace.cases.some((item) => item.id === nextCase.id)) {
    throw new RangeError(`Duplicate case id: ${nextCase.id}`);
  }
  return { ...workspace, cases: [...workspace.cases, nextCase] };
}

export function duplicateComparisonCase(
  workspace: ComparisonWorkspace,
  sourceCaseId: string,
  newId: string,
  newName?: string,
): ComparisonWorkspace {
  const source = workspace.cases.find((item) => item.id === sourceCaseId);
  if (source === undefined) throw new RangeError(`Unknown case: ${sourceCaseId}`);
  const duplicate = createComparisonCase(
    newId,
    newName ?? `${source.name} copy`,
    source.parameters,
  );
  return addComparisonCase(workspace, duplicate);
}

export function renameComparisonCase(
  workspace: ComparisonWorkspace,
  caseId: string,
  name: string,
): ComparisonWorkspace {
  const nextName = requireText(name, "case name");
  let found = false;
  const cases = workspace.cases.map((item) => {
    if (item.id !== caseId) return item;
    found = true;
    return { ...item, name: nextName };
  });
  if (!found) throw new RangeError(`Unknown case: ${caseId}`);
  return { ...workspace, cases };
}

export function replaceComparisonCase(
  workspace: ComparisonWorkspace,
  nextCase: ComparisonCase,
): ComparisonWorkspace {
  let found = false;
  const cases = workspace.cases.map((item) => {
    if (item.id !== nextCase.id) return item;
    found = true;
    return nextCase;
  });
  if (!found) throw new RangeError(`Unknown case: ${nextCase.id}`);
  return { ...workspace, cases };
}

export function deleteComparisonCase(
  workspace: ComparisonWorkspace,
  caseId: string,
): ComparisonWorkspace {
  if (workspace.cases.length <= MIN_COMPARISON_CASES) {
    throw new RangeError("The final comparison case cannot be deleted");
  }
  const cases = workspace.cases.filter((item) => item.id !== caseId);
  if (cases.length === workspace.cases.length) {
    throw new RangeError(`Unknown case: ${caseId}`);
  }
  return {
    cases,
    baselineCaseId:
      workspace.baselineCaseId === caseId
        ? cases[0]!.id
        : workspace.baselineCaseId,
  };
}

export function setBaselineCase(
  workspace: ComparisonWorkspace,
  caseId: string,
): ComparisonWorkspace {
  if (!workspace.cases.some((item) => item.id === caseId)) {
    throw new RangeError(`Unknown case: ${caseId}`);
  }
  return { ...workspace, baselineCaseId: caseId };
}
