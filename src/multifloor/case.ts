import type {
  MultiFloorCase,
  MultiFloorDefinition,
  MultiFloorWorkspace,
} from "./types";

export const MIN_MULTI_FLOOR_CASES = 1;
export const MAX_MULTI_FLOOR_CASES = 4;
export const MIN_FLOORS_PER_CASE = 1;

export const DEFAULT_MULTI_FLOOR_DEFINITION: MultiFloorDefinition = Object.freeze({
  id: "floor-1",
  name: "1F",
  floorHeightM: 3.8,
  opening: Object.freeze({
    centerXM: 0,
    widthM: 6,
    heightM: 2.4,
    sillHeightM: 0.9,
  }),
  overhang: Object.freeze({
    depthM: 0.8,
    elevationM: 3.6,
    leftExtensionM: 0.5,
    rightExtensionM: 0.5,
  }),
  solarHeatGainCoefficient: 0.5,
});

function requireText(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed === "") throw new RangeError(`${label} must not be empty`);
  return trimmed;
}
export function cloneMultiFloorDefinition(
  floor: MultiFloorDefinition,
): MultiFloorDefinition {
  return {
    id: floor.id,
    name: floor.name,
    floorHeightM: floor.floorHeightM,
    opening: { ...floor.opening },
    ...(floor.overhang === undefined
      ? {}
      : { overhang: { ...floor.overhang } }),
    solarHeatGainCoefficient: floor.solarHeatGainCoefficient,
  };
}

export function cloneMultiFloorCase(item: MultiFloorCase): MultiFloorCase {
  return {
    id: item.id,
    name: item.name,
    facadeAzimuthDegFromNorth: item.facadeAzimuthDegFromNorth,
    groundReflectance: item.groundReflectance,
    floors: item.floors.map(cloneMultiFloorDefinition),
  };
}

export function createMultiFloorDefinition(
  id: string,
  name: string,
  template: MultiFloorDefinition = DEFAULT_MULTI_FLOOR_DEFINITION,
): MultiFloorDefinition {
  return {
    ...cloneMultiFloorDefinition(template),
    id: requireText(id, "floor id"),
    name: requireText(name, "floor name"),
  };
}

export function createMultiFloorCase(
  id: string,
  name: string,
  floors: readonly MultiFloorDefinition[] = [
    createMultiFloorDefinition("floor-1", "1F"),
  ],
  facadeAzimuthDegFromNorth = 180,
  groundReflectance = 0.2,
): MultiFloorCase {
  return {
    id: requireText(id, "case id"),
    name: requireText(name, "case name"),
    facadeAzimuthDegFromNorth,
    groundReflectance,
    floors: floors.map(cloneMultiFloorDefinition),
  };
}

export function createMultiFloorWorkspace(
  initialCase: MultiFloorCase = createMultiFloorCase("building-a", "建物案A"),
): MultiFloorWorkspace {
  return { cases: [cloneMultiFloorCase(initialCase)], baselineCaseId: initialCase.id };
}

export function replaceMultiFloorCase(
  workspace: MultiFloorWorkspace,
  nextCase: MultiFloorCase,
): MultiFloorWorkspace {
  let found = false;
  const cases = workspace.cases.map((item) => {
    if (item.id !== nextCase.id) return item;
    found = true;
    return cloneMultiFloorCase(nextCase);
  });
  if (!found) throw new RangeError(`Unknown building case: ${nextCase.id}`);
  return { ...workspace, cases };
}

export function addMultiFloorCase(
  workspace: MultiFloorWorkspace,
  nextCase: MultiFloorCase,
): MultiFloorWorkspace {
  if (workspace.cases.length >= MAX_MULTI_FLOOR_CASES) {
    throw new RangeError(`Multi-floor comparison supports at most ${MAX_MULTI_FLOOR_CASES} cases`);
  }
  if (workspace.cases.some((item) => item.id === nextCase.id)) {
    throw new RangeError(`Duplicate building case id: ${nextCase.id}`);
  }
  return { ...workspace, cases: [...workspace.cases, cloneMultiFloorCase(nextCase)] };
}

export function duplicateMultiFloorCase(
  workspace: MultiFloorWorkspace,
  sourceCaseId: string,
  newId: string,
  newName: string,
): MultiFloorWorkspace {
  const source = workspace.cases.find((item) => item.id === sourceCaseId);
  if (source === undefined) throw new RangeError(`Unknown building case: ${sourceCaseId}`);
  return addMultiFloorCase(workspace, {
    ...cloneMultiFloorCase(source),
    id: requireText(newId, "case id"),
    name: requireText(newName, "case name"),
  });
}

export function deleteMultiFloorCase(
  workspace: MultiFloorWorkspace,
  caseId: string,
): MultiFloorWorkspace {
  if (workspace.cases.length <= MIN_MULTI_FLOOR_CASES) {
    throw new RangeError("The final building case cannot be deleted");
  }
  const cases = workspace.cases.filter((item) => item.id !== caseId);
  if (cases.length === workspace.cases.length) {
    throw new RangeError(`Unknown building case: ${caseId}`);
  }
  return {
    cases,
    baselineCaseId:
      workspace.baselineCaseId === caseId
        ? cases[0]!.id
        : workspace.baselineCaseId,
  };
}

export function setMultiFloorBaseline(
  workspace: MultiFloorWorkspace,
  caseId: string,
): MultiFloorWorkspace {
  if (!workspace.cases.some((item) => item.id === caseId)) {
    throw new RangeError(`Unknown building case: ${caseId}`);
  }
  return { ...workspace, baselineCaseId: caseId };
}

export function renameMultiFloorCase(
  workspace: MultiFloorWorkspace,
  caseId: string,
  name: string,
): MultiFloorWorkspace {
  const item = workspace.cases.find((candidate) => candidate.id === caseId);
  if (item === undefined) throw new RangeError(`Unknown building case: ${caseId}`);
  return replaceMultiFloorCase(workspace, {
    ...item,
    name: requireText(name, "case name"),
  });
}

export function replaceFloor(
  item: MultiFloorCase,
  nextFloor: MultiFloorDefinition,
): MultiFloorCase {
  let found = false;
  const floors = item.floors.map((floor) => {
    if (floor.id !== nextFloor.id) return floor;
    found = true;
    return cloneMultiFloorDefinition(nextFloor);
  });
  if (!found) throw new RangeError(`Unknown floor: ${nextFloor.id}`);
  return { ...item, floors };
}

export function addFloor(
  item: MultiFloorCase,
  nextFloor: MultiFloorDefinition,
): MultiFloorCase {
  if (item.floors.some((floor) => floor.id === nextFloor.id)) {
    throw new RangeError(`Duplicate floor id: ${nextFloor.id}`);
  }
  return { ...item, floors: [...item.floors, cloneMultiFloorDefinition(nextFloor)] };
}

export function duplicateFloor(
  item: MultiFloorCase,
  sourceFloorId: string,
  newId: string,
  newName: string,
): MultiFloorCase {
  const source = item.floors.find((floor) => floor.id === sourceFloorId);
  if (source === undefined) throw new RangeError(`Unknown floor: ${sourceFloorId}`);
  return addFloor(item, {
    ...cloneMultiFloorDefinition(source),
    id: requireText(newId, "floor id"),
    name: requireText(newName, "floor name"),
  });
}

export function deleteFloor(
  item: MultiFloorCase,
  floorId: string,
): MultiFloorCase {
  if (item.floors.length <= MIN_FLOORS_PER_CASE) {
    throw new RangeError("The final floor cannot be deleted");
  }
  const floors = item.floors.filter((floor) => floor.id !== floorId);
  if (floors.length === item.floors.length) {
    throw new RangeError(`Unknown floor: ${floorId}`);
  }
  return { ...item, floors };
}

export function renameFloor(
  item: MultiFloorCase,
  floorId: string,
  name: string,
): MultiFloorCase {
  const floor = item.floors.find((candidate) => candidate.id === floorId);
  if (floor === undefined) throw new RangeError(`Unknown floor: ${floorId}`);
  return replaceFloor(item, {
    ...floor,
    name: requireText(name, "floor name"),
  });
}
