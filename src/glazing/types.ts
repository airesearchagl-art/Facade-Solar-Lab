export const METRICS = ['etaShgc', 'ugWm2K', 'visibleTransmittance', 'visibleReflectance'] as const;
export type MetricName = typeof METRICS[number];
export type Verification = 'DIRECT_TABLE_CHECKED' | 'SOURCE_RECHECK_PENDING' | 'UNVERIFIED';
export interface Source {
  sourceRef: string; manufacturer: string; originalSourceUrl: string; originalTable: string;
  rowIdentifier: string; rowNumber: string | null; rowDescriptor: string | null;
  sourceEdition: string | null; sourceRevision: string | null; manufacturerProductRevision: string | null;
  effectiveDate: string | null; retrievedAt: string; retrievalDateBasis: string;
  accessStatus: string; verificationStatus: Verification; evidenceReference: string;
}
export interface UserSource extends Omit<Source, 'originalSourceUrl' | 'retrievedAt' | 'verificationStatus'> {
  originalSourceUrl: string | null; retrievedAt: string | null; verificationStatus: 'UNVERIFIED';
}
export interface Boundary { identity: string; parameters: { name: string; value: number | string | boolean | null; unit: string | null }[] }
export interface MetricBasis<S = Source> {
  value: number | null; unit: 'fraction' | 'W/m2K'; evaluationScope: string;
  incidenceSide: 'EXTERIOR' | 'INTERIOR' | 'UNKNOWN' | 'NOT_APPLICABLE'; incidenceAngleDeg: number | null;
  calculationOrTestStandard: string | null; boundaryConditions: Boundary | null;
  evidenceRef: string; verificationStatus: Verification; resolvedSource: S;
}
export type FourMetricBasis<S = Source> = Record<MetricName, MetricBasis<S>>;
export interface AssemblySnapshot {
  sourceNotation: string; nominalOverallThicknessMm: number; paneThicknessesMm: number[];
  cavityThicknessMm: number; sourceGasLabel: string; gasFillRatio: number | null;
  outsideToInsideConfirmed: boolean; coatingSurface: string | null; sourcePaneCodes: string[] | null;
}
export interface CatalogSelection {
  kind: 'catalog_record'; recordId: string; recordRevision: string; normalizedContentDigest: string;
  savedEtaShgc: number; metricBasisVersion: 'glz-metric-basis-v1'; metricBasisDigest: string;
  savedMetricBasis: FourMetricBasis; savedAssemblyIdentity: string; savedAssembly: AssemblySnapshot;
  resolutionState: 'RESOLVED' | 'UNRESOLVED_CATALOG';
}
export type GlassSelection = { kind: 'manual_shgc'; etaShgc: number } | CatalogSelection;
export interface G1UserEntry {
  id: string; name: string; origin: 'user_entry'; userRevision: string;
  metrics: FourMetricBasis<UserSource>; assemblyDescription: string | null;
  assembly: AssemblySnapshot | null; entryContentDigest: string;
}
export interface G1LocalRecordEntry { id: string; name: string; origin: 'local_record'; selection: CatalogSelection }
export type Entry = G1UserEntry | G1LocalRecordEntry;
export interface Workspace { entries: Entry[]; selectedEntryId: string }
export type RegistrySource = Omit<Source, 'sourceRef' | 'rowIdentifier' | 'rowNumber' | 'rowDescriptor' | 'manufacturerProductRevision'>;
export interface LocalRecord {
  recordId: string; legacyResearchId: string | null; recordRevision: string; manufacturerProductRevision: string | null;
  retrievedAt: string; normalizedContentDigest: string; manufacturer: string; productName: string;
  productAbbreviation: string | null; sourceEdition: string | null; sourceRevision: string | null;
  publicationPermissionStatus: string; allowPublicBundle: false; correctionOf: string | null;
  supersededBy: string | null; availabilityStatus: string; assembly: AssemblySnapshot;
  rowEvidence: { sourceRef: string; rowIdentifier: string; verificationStatus: Verification; rowDescriptor?: string | null };
  metrics: FourMetricBasis; metricBasisVersion: 'glz-metric-basis-v1'; metricBasisDigest: string; assemblyIdentity: string;
}
export const WORKSPACE_KIND = 'facade-solar-lab-glazing-workspace-preset';
export const RECORD_KIND = 'facade-solar-lab-glazing-record-input';
export interface RecordInput { kind: typeof RECORD_KIND; schemaVersion: 1; record: LocalRecord; sourceRegistry: Record<string, RegistrySource> }
export interface WorkspaceInput { kind: typeof WORKSPACE_KIND; schemaVersion: 1; workspace: Workspace }
export type Input = RecordInput | WorkspaceInput;
export type HashPort = (bytes: Uint8Array) => Promise<Uint8Array>;
