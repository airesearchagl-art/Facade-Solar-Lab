import type { VerticalFins } from "../../geometry/facade-v2";
import { IntermediateFinEditor, IntermediateFinSummary } from "./IntermediateFinEditor";

export function FinEditor({ fins, widthM = NaN, sillZM, headZM, inputPrefix, issues, onChange }: {
  readonly fins: VerticalFins;
  readonly widthM?: number;
  readonly sillZM: number;
  readonly headZM: number;
  readonly inputPrefix: string;
  readonly issues: ReadonlyMap<string, string>;
  readonly onChange: (next: VerticalFins) => void;
}) {
  return <div className="fin-editors">
    <h3>端部フィン（左端・右端）</h3>
    {(["leftFin", "rightFin"] as const).map((key) => {
      const fin = fins[key];
      const label = key === "leftFin" ? "左フィン" : "右フィン";
      return <fieldset key={key}>
        <legend>{label}</legend>
        <label className="switch-row"><input type="checkbox" aria-label={`${label}を使用`} checked={fin !== undefined} onChange={(event) => onChange({ ...fins, [key]: event.currentTarget.checked ? { depthM: 0.6, bottomZM: sillZM, topZM: headZM } : undefined })} /><span>{fin === undefined ? "なし" : "あり"}</span></label>
        {fin === undefined ? null : <div className="field-grid">
          {([["depthM", "出", 0], ["bottomZM", "下端", undefined], ["topZM", "上端", undefined]] as const).map(([field, name, min]) => {
            const id = `${inputPrefix}-${key}-${field}`;
            const issue = issues.get(`${key}.${field}`);
            return <label className="field" htmlFor={id} key={field}><span>{label} {name} <small>[m]</small></span><input id={id} type="number" step="0.1" min={min} value={Number.isFinite(fin[field]) ? fin[field] : ""} aria-invalid={issue === undefined ? undefined : true} aria-describedby={issue === undefined ? undefined : `${id}-issue`} onChange={(event) => onChange({ ...fins, [key]: { ...fin, [field]: event.currentTarget.valueAsNumber } })} />{issue === undefined ? null : <small className="field-error" id={`${id}-issue`}>{issue}</small>}</label>;
          })}
        </div>}
      </fieldset>;
    })}
    <IntermediateFinEditor fin={fins.intermediateFins} widthM={widthM} sillZM={sillZM} headZM={headZM} prefix={inputPrefix} issues={issues} onChange={(intermediateFins) => onChange({ ...fins, intermediateFins })} />
    <p className="field-note">端部フィンは開口の左右端、中間フィンは中央割付。上端・下端はこの階の床基準です。直達影のみ計算し、天空日射へのフィン効果・上下階相互遮蔽は計算しません。</p>
  </div>;
}

export function FinSummary({ fins, widthM = NaN }: { readonly fins: VerticalFins; readonly widthM?: number }) {
  return <div><dl className="fin-summary">{(["leftFin", "rightFin"] as const).map((key) => {
    const fin = fins[key];
    return <div key={key}><dt>{key === "leftFin" ? "左フィン" : "右フィン"}</dt><dd>{fin === undefined ? "なし" : `出 ${fin.depthM} m / 下端 ${fin.bottomZM} m / 上端 ${fin.topZM} m`}</dd></div>;
  })}</dl><IntermediateFinSummary fin={fins.intermediateFins} widthM={widthM} /></div>;
}
