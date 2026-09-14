import type { MultiFloorDefinition } from "../../multifloor";

interface FloorEditorProps {
  readonly floor: MultiFloorDefinition;
  readonly inputPrefix: string;
  readonly issues: ReadonlyMap<string, string>;
  readonly onChange: (next: MultiFloorDefinition) => void;
}
function FloorNumberField({
  id,
  label,
  value,
  step = 0.1,
  issue,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly step?: number;
  readonly issue?: string;
  readonly onChange: (value: number) => void;
}) {
  const issueId = `${id}-issue`;
  return (
    <label className="field" htmlFor={id}>
      <span>{label} <small>[m]</small></span>
      <input id={id} type="number" step={step} value={Number.isFinite(value) ? value : ""} aria-invalid={issue === undefined ? undefined : true} aria-describedby={issue === undefined ? undefined : issueId} onChange={(event) => onChange(event.currentTarget.valueAsNumber)} />
      {issue === undefined ? null : <small className="field-error" id={issueId}>{issue}</small>}
    </label>
  );
}

export function FloorEditor({ floor, inputPrefix, issues, onChange }: FloorEditorProps) {
  const updateOpening = (next: Partial<MultiFloorDefinition["opening"]>) => onChange({
    ...floor,
    opening: { ...floor.opening, ...next },
  });
  const updateOverhang = (next: Partial<NonNullable<MultiFloorDefinition["overhang"]>>) => onChange({
    ...floor,
    overhang: { ...floor.overhang!, ...next },
  });
  return (
    <div className="floor-editor">
      <div className="field-grid">
        <FloorNumberField id={`${inputPrefix}-height`} label="階高" value={floor.floorHeightM} issue={issues.get("floorHeightM")} onChange={(value) => onChange({ ...floor, floorHeightM: value })} />
        <FloorNumberField id={`${inputPrefix}-opening-width`} label="開口幅" value={floor.opening.widthM} issue={issues.get("opening.widthM")} onChange={(value) => updateOpening({ widthM: value })} />
        <FloorNumberField id={`${inputPrefix}-opening-height`} label="開口高さ" value={floor.opening.heightM} issue={issues.get("opening.heightM")} onChange={(value) => updateOpening({ heightM: value })} />
        <FloorNumberField id={`${inputPrefix}-sill`} label="腰壁高さ" value={floor.opening.sillHeightM} issue={issues.get("opening.sillHeightM")} onChange={(value) => updateOpening({ sillHeightM: value })} />
      </div>
      <p className="derived-floor-value">開口上端: <strong>{Number.isFinite(floor.opening.sillHeightM + floor.opening.heightM) ? `${(floor.opening.sillHeightM + floor.opening.heightM).toFixed(2)} m` : "—"}</strong>（階床基準）</p>
      <label className="field" htmlFor={`${inputPrefix}-shgc`}>
        <span>日射熱取得率（SHGC）</span>
        <input id={`${inputPrefix}-shgc`} type="number" step="0.05" value={Number.isFinite(floor.solarHeatGainCoefficient) ? floor.solarHeatGainCoefficient : ""} aria-invalid={issues.has("solarHeatGainCoefficient") || undefined} onChange={(event) => onChange({ ...floor, solarHeatGainCoefficient: event.currentTarget.valueAsNumber })} />
        {issues.get("solarHeatGainCoefficient") === undefined ? null : <small className="field-error">{issues.get("solarHeatGainCoefficient")}</small>}
      </label>
      <fieldset>
        <legend>水平庇</legend>
        <label className="switch-row">
          <input type="checkbox" checked={floor.overhang !== undefined} onChange={(event) => onChange(event.currentTarget.checked ? {
            ...floor,
            overhang: {
              depthM: 0.8,
              elevationM: Math.min(floor.floorHeightM, floor.opening.sillHeightM + floor.opening.heightM + 0.3),
              leftExtensionM: 0.5,
              rightExtensionM: 0.5,
            },
          } : { ...floor, overhang: undefined })} />
          <span>{floor.overhang === undefined ? "なし" : "あり"}</span>
        </label>
        {floor.overhang === undefined ? <p className="field-note">この階では庇形状を計算モデルへ渡しません。</p> : (
          <div className="field-grid">
            <FloorNumberField id={`${inputPrefix}-overhang-depth`} label="庇の出" value={floor.overhang.depthM} issue={issues.get("overhang.depthM")} onChange={(value) => updateOverhang({ depthM: value })} />
            <FloorNumberField id={`${inputPrefix}-overhang-elevation`} label="庇高さ" value={floor.overhang.elevationM} issue={issues.get("overhang.elevationM")} onChange={(value) => updateOverhang({ elevationM: value })} />
            <FloorNumberField id={`${inputPrefix}-overhang-left`} label="左側延長" value={floor.overhang.leftExtensionM} issue={issues.get("overhang.leftExtensionM")} onChange={(value) => updateOverhang({ leftExtensionM: value })} />
            <FloorNumberField id={`${inputPrefix}-overhang-right`} label="右側延長" value={floor.overhang.rightExtensionM} issue={issues.get("overhang.rightExtensionM")} onChange={(value) => updateOverhang({ rightExtensionM: value })} />
          </div>
        )}
      </fieldset>
    </div>
  );
}
