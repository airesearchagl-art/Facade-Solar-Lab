import type { MultiFloorCase, MultiFloorDefinition } from "../../multifloor";
import { FloorEditor } from "./FloorEditor";

interface MultiFloorCaseEditorProps {
  readonly buildingCase: MultiFloorCase;
  readonly selectedFloorId: string;
  readonly issues: readonly { readonly floorId?: string; readonly path: string; readonly message: string }[];
  readonly onCaseChange: (next: MultiFloorCase) => void;
  readonly onSelectFloor: (floorId: string) => void;
  readonly onAddFloor: () => void;
  readonly onDuplicateFloor: () => void;
  readonly onDeleteFloor: () => void;
}

export function MultiFloorCaseEditor({
  buildingCase,
  selectedFloorId,
  issues,
  onCaseChange,
  onSelectFloor,
  onAddFloor,
  onDuplicateFloor,
  onDeleteFloor,
}: MultiFloorCaseEditorProps) {
  const selectedFloor = buildingCase.floors.find((floor) => floor.id === selectedFloorId) ?? buildingCase.floors[0]!;
  const floorIssues = new Map(
    issues.filter((issue) => issue.floorId === selectedFloor.id).map((issue) => [issue.path, issue.message]),
  );
  const updateSelectedFloor = (next: MultiFloorDefinition) => onCaseChange({
    ...buildingCase,
    floors: buildingCase.floors.map((floor) => floor.id === next.id ? next : floor),
  });
  return (
    <div className="multifloor-case-editor">
      <fieldset>
        <legend>建物案共通条件</legend>
        <div className="field-grid">
          <label className="field" htmlFor={`${buildingCase.id}-azimuth`}>
            <span>ファサード方位角 <small>[° 北=0、時計回り]</small></span>
            <input id={`${buildingCase.id}-azimuth`} type="number" step="1" value={Number.isFinite(buildingCase.facadeAzimuthDegFromNorth) ? buildingCase.facadeAzimuthDegFromNorth : ""} aria-invalid={issues.some((issue) => issue.path === "facadeAzimuthDegFromNorth") || undefined} onChange={(event) => onCaseChange({ ...buildingCase, facadeAzimuthDegFromNorth: event.currentTarget.valueAsNumber })} />
          </label>
          <label className="field" htmlFor={`${buildingCase.id}-ground`}>
            <span>地面反射率</span>
            <input id={`${buildingCase.id}-ground`} type="number" step="0.05" value={Number.isFinite(buildingCase.groundReflectance) ? buildingCase.groundReflectance : ""} aria-invalid={issues.some((issue) => issue.path === "groundReflectance") || undefined} onChange={(event) => onCaseChange({ ...buildingCase, groundReflectance: event.currentTarget.valueAsNumber })} />
          </label>
        </div>
      </fieldset>

      <div className="floor-heading">
        <div><p className="section-kicker">階構成 · 下階から上階</p><h3>Floorを編集</h3></div>
        <div className="case-actions">
          <button type="button" className="secondary-button" onClick={onAddFloor}>Floor追加</button>
          <button type="button" className="secondary-button" onClick={onDuplicateFloor}>Floor複製</button>
          <button type="button" className="text-button danger" disabled={buildingCase.floors.length === 1} onClick={onDeleteFloor}>Floor削除</button>
        </div>
      </div>
      <div className="floor-tabs" role="group" aria-label="編集する階">
        {buildingCase.floors.map((floor, index) => (
          <button type="button" key={floor.id} aria-label={`${floor.name}（下から${index + 1}番目）`} aria-pressed={floor.id === selectedFloor.id} className={floor.id === selectedFloor.id ? "floor-tab active" : "floor-tab"} onClick={() => onSelectFloor(floor.id)}>
            <strong className="floor-tab-name">{floor.name}</strong>
            <small className="floor-tab-position">下から{index + 1}番目</small>
          </button>
        ))}
      </div>
      <label className="field name-field" htmlFor={`${buildingCase.id}-${selectedFloor.id}-name`}>
        <span>階名称</span>
        <input id={`${buildingCase.id}-${selectedFloor.id}-name`} value={selectedFloor.name} aria-invalid={floorIssues.has("name") || undefined} onChange={(event) => updateSelectedFloor({ ...selectedFloor, name: event.currentTarget.value })} />
      </label>
      <FloorEditor floor={selectedFloor} inputPrefix={`${buildingCase.id}-${selectedFloor.id}`} issues={floorIssues} onChange={updateSelectedFloor} />
      {issues.length === 0 ? null : (
        <div className="message error-message" role="alert"><strong>複数階計算の前に入力を修正してください。</strong><ul>{issues.map((issue, index) => <li key={`${issue.floorId ?? "case"}-${issue.path}-${index}`}>{issue.floorId === undefined ? "建物案" : buildingCase.floors.find((floor) => floor.id === issue.floorId)?.name ?? issue.floorId}: {issue.message}</li>)}</ul></div>
      )}
    </div>
  );
}
