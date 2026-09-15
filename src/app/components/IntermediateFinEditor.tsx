import { deriveFinLayout, MAX_INTERMEDIATE_FINS, type VerticalFins } from "../../geometry/facade-v2";
type Fin = NonNullable<VerticalFins["intermediateFins"]>;

export function IntermediateFinSummary({ fin, widthM }: { readonly fin?: Fin; readonly widthM: number }) {
  if (!fin) return <p className="array-summary">中間フィン: なし</p>;
  try {
    const d = deriveFinLayout(widthM, fin.layout);
    return <div className="array-summary"><strong>中間フィン · 中央割付</strong><p>{fin.layout.mode === "pitch" ? `ピッチ指定 ${fin.layout.pitchM} m` : `枚数指定 ${fin.layout.count}枚`} / 出 {fin.depthM} m / 下端 {fin.bottomZM} m / 上端 {fin.topZM} m</p><p>実配置: {d.count}枚 / 中心ピッチ: {d.pitchM === null ? "—（配置なし）" : `${d.pitchM.toFixed(2)} m`} / 左右端部余白: {d.edgeMarginM === null ? "—（配置なし）" : `${d.edgeMarginM.toFixed(2)} m`}</p>{fin.depthM === 0 ? <p>出0 m: 影なし</p> : null}</div>;
  } catch { return <p className="field-error">中間フィンの入力・開口幅を確認してください。</p>; }
}

export function IntermediateFinEditor({ fin, widthM, sillZM, headZM, prefix, issues, onChange }: {
  readonly fin?: Fin; readonly widthM: number; readonly sillZM: number; readonly headZM: number;
  readonly prefix: string; readonly issues: ReadonlyMap<string, string>; readonly onChange: (fin: Fin | undefined) => void;
}) {
  const layoutIssue = issues.get("intermediateFins.layout");
  return <fieldset className="intermediate-fin-editor"><legend>中間フィン</legend>
    <label className="switch-row"><input type="checkbox" aria-label="中間フィンを使用" checked={fin !== undefined} onChange={(e) => onChange(e.currentTarget.checked ? { depthM: 0.6, bottomZM: sillZM, topZM: headZM, layout: { mode: "pitch", pitchM: 1.5 } } : undefined)} />{fin ? "あり" : "なし"}</label>
    {fin ? <>
      <p className="field-note">中央割付・厚さなし。ピッチは中心ピッチです。最大{MAX_INTERMEDIATE_FINS}枚、上限超過はエラー。</p>
      <label className="field"><span>中間フィン 配置方式</span><select aria-label="中間フィン 配置方式" value={fin.layout.mode} onChange={(e) => onChange({ ...fin, layout: e.currentTarget.value === "count" ? { mode: "count", count: 3 } : { mode: "pitch", pitchM: 1.5 } })}><option value="pitch">ピッチ指定</option><option value="count">枚数指定</option></select></label>
      <label className="field"><span>{fin.layout.mode === "pitch" ? "中間フィン 中心ピッチ [m]" : "中間フィン 枚数"}</span><input type="number" min={fin.layout.mode === "pitch" ? undefined : 1} max={fin.layout.mode === "count" ? MAX_INTERMEDIATE_FINS : undefined} step={fin.layout.mode === "pitch" ? 0.1 : 1} value={Number.isFinite(fin.layout.mode === "pitch" ? fin.layout.pitchM : fin.layout.count) ? fin.layout.mode === "pitch" ? fin.layout.pitchM : fin.layout.count : ""} aria-invalid={layoutIssue ? true : undefined} aria-describedby={layoutIssue ? `${prefix}-array-layout-error` : undefined} onChange={(e) => onChange({ ...fin, layout: fin.layout.mode === "pitch" ? { mode: "pitch", pitchM: e.currentTarget.valueAsNumber } : { mode: "count", count: e.currentTarget.valueAsNumber } })} /></label>
      {layoutIssue ? <p className="field-error" id={`${prefix}-array-layout-error`}>{layoutIssue}</p> : null}
      <div className="field-grid">{([["depthM", "出"], ["bottomZM", "下端"], ["topZM", "上端"]] as const).map(([field, label]) => {
        const issue = issues.get(`intermediateFins.${field}`), id = `${prefix}-array-${field}`;
        return <label className="field" key={field}><span>中間フィン {label} [m]</span><input type="number" step="0.1" min={field === "depthM" ? 0 : undefined} value={Number.isFinite(fin[field]) ? fin[field] : ""} aria-invalid={issue ? true : undefined} aria-describedby={issue ? `${id}-error` : undefined} onChange={(e) => onChange({ ...fin, [field]: e.currentTarget.valueAsNumber })} />{issue ? <small id={`${id}-error`} className="field-error">{issue}</small> : null}</label>;
      })}</div>
      <IntermediateFinSummary fin={fin} widthM={widthM} />
    </> : <p className="field-note">実配置: 0枚 / 中心ピッチ: — / 左右端部余白: —</p>}
  </fieldset>;
}
