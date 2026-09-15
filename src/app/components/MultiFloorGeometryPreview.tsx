import { useId, useMemo } from "react";

import { createMultiFloorReferences, positionFloors, type MultiFloorCase } from "../../multifloor";
import type { WeatherDataset } from "../../weather";
import { finInputIssues } from "../../comparison/fin-input";
import { deriveFinLayout } from "../../geometry/facade-v2";

interface MultiFloorGeometryPreviewProps {
  readonly buildingCase: MultiFloorCase;
  readonly selectedFloorId?: string;
  readonly dataset: WeatherDataset | null;
  readonly report?: boolean;
}

export function MultiFloorGeometryPreview({ buildingCase, selectedFloorId, dataset, report = false }: MultiFloorGeometryPreviewProps) {
  const clipId = useId();
  const positioned = useMemo(() => positionFloors(buildingCase), [buildingCase]);
  const totalHeight = positioned.at(-1)?.topZM ?? 0;
  const geometryValid = totalHeight > 0 && positioned.every(({ floor }) =>
    finInputIssues(floor, floor.opening.widthM).length === 0 &&
    Number.isFinite(floor.floorHeightM) && floor.floorHeightM > 0 &&
    Number.isFinite(floor.opening.widthM) && floor.opening.widthM > 0 &&
    Number.isFinite(floor.opening.heightM) && floor.opening.heightM > 0 &&
    Number.isFinite(floor.opening.sillHeightM) &&
    (floor.overhang === undefined || Object.values(floor.overhang).every(Number.isFinite)),
  );
  const references = useMemo(() => geometryValid && dataset !== null ? createMultiFloorReferences(dataset, buildingCase) : [], [buildingCase, dataset, geometryValid]);
  if (!geometryValid) return <div className="geometry-empty" role="status">形状入力を修正すると積層図を表示します。</div>;

  // Independent label [0, 88), drawing [96, 296], and dimension [310, 420) gutters.
  const minHeight = Math.min(...positioned.map(({ floor }) => floor.floorHeightM));
  const zScale = Math.max(28, 62 / minHeight);
  const drawingTop = 32;
  const drawingBottom = drawingTop + totalHeight * zScale;
  const viewHeight = drawingBottom + 26;
  const zToY = (z: number) => drawingBottom - z * zScale;
  const extent = Math.max(1, ...positioned.map(({ floor }) => floor.opening.widthM + (floor.overhang?.leftExtensionM ?? 0) + (floor.overhang?.rightExtensionM ?? 0)));
  const xScale = 190 / extent;
  const depthScale = 115 / Math.max(1, ...positioned.map(({ floor }) => floor.overhang?.depthM ?? 0));
  const wallX = 274;
  const selected = selectedFloorId ?? positioned[0]?.floor.id;
  const gutter = (floor: MultiFloorCase["floors"][number], baseZM: number, topZM: number) => (
    <g className="floor-label-gutter">
      <text className="floor-name" x="12" y={zToY((baseZM + topZM) / 2)} dominantBaseline="middle"><title>{floor.name}</title>{Array.from(floor.name).length > 5 ? Array.from(floor.name).slice(0, 5).join("") + "…" : floor.name}</text>
      <text className="floor-height" x="316" y={zToY((baseZM + topZM) / 2)} dominantBaseline="middle">{floor.floorHeightM.toFixed(2)} m</text>
    </g>
  );
  return (
    <div className={report ? "multifloor-geometry report" : "multifloor-geometry"}>
      <figure className="geometry-figure">
        <figcaption><strong>積層立面</strong><span>累積建物高さ {totalHeight.toFixed(2)} m</span></figcaption>
        <svg viewBox={`0 0 420 ${viewHeight}`} role="img" aria-label={`${buildingCase.name}の複数階立面`}>
          <title>{`${buildingCase.name}の積層立面`}</title>
          <text className="gutter-heading" x="12" y="17">階名称</text><text className="gutter-heading" x="316" y="17">階高</text>
          <rect className="wall-fill" x="96" y={drawingTop} width="200" height={drawingBottom - drawingTop} />
          {positioned.map(({ floor, baseZM, topZM }) => {
            const width = floor.opening.widthM * xScale;
            const left = 196 - width / 2;
            const overhang = floor.overhang;
            return <g key={floor.id} className={!report && floor.id === selected ? "selected-floor" : undefined}>
              <line className="drawing-line datum" x1="96" x2="296" y1={zToY(baseZM)} y2={zToY(baseZM)} />
              <rect className="opening-fill front-opening" x={left} y={zToY(baseZM + floor.opening.sillHeightM + floor.opening.heightM)} width={width} height={floor.opening.heightM * zScale} />
              {overhang === undefined ? null : <line className="drawing-line overhang-line" x1={left - overhang.leftExtensionM * xScale} x2={left + width + overhang.rightExtensionM * xScale} y1={zToY(baseZM + overhang.elevationM)} y2={zToY(baseZM + overhang.elevationM)} />}
              {(["leftFin", "rightFin"] as const).map((key) => {
                const fin = floor[key];
                if (fin === undefined || fin.depthM === 0) return null;
                const bottom = Math.max(0, fin.bottomZM);
                const top = Math.min(floor.floorHeightM, fin.topZM);
                if (top <= bottom) return null;
                const x = key === "leftFin" ? left : left + width;
                return <line key={key} data-floor-id={floor.id} data-fin={key} className={`drawing-line fin-line ${key}`} x1={x} x2={x} y1={zToY(baseZM + top)} y2={zToY(baseZM + bottom)}><title>{`${floor.name} ${key}: 出 ${fin.depthM} m / 下端 ${fin.bottomZM} m / 上端 ${fin.topZM} m（表示のみ階境界で区切る）`}</title></line>;
              })}
              {gutter(floor, baseZM, topZM)}
              {floor.intermediateFins && floor.intermediateFins.depthM > 0 ? deriveFinLayout(floor.opening.widthM, floor.intermediateFins.layout).positionsFromLeftM.map((offset, i) => {
                const fin = floor.intermediateFins!;
                const bottom = Math.max(0, fin.bottomZM), top = Math.min(floor.floorHeightM, fin.topZM);
                if (top <= bottom) return null;
                const x = left + offset * xScale;
                return <line key={`array-${i}`} data-floor-id={floor.id} data-fin="intermediate" className="drawing-line fin-line intermediateFin" x1={x} x2={x} y1={zToY(baseZM + top)} y2={zToY(baseZM + bottom)}><title>{`${floor.name} 中間フィン ${i + 1}: 左端から${offset} m（階境界のclipは表示のみ）`}</title></line>;
              }) : null}
              <title>{`${floor.name}: 階高 ${floor.floorHeightM} m / 開口 ${floor.opening.widthM} × ${floor.opening.heightM} m`}</title>
            </g>;
          })}
          <line className="drawing-line datum" x1="96" x2="296" y1={drawingTop} y2={drawingTop} />
        </svg>
        <p className="field-note">左右端は端部フィン、開口内は中間フィン配列。長いフィンは階ごとの表示範囲で区切ります（可視化のみ）。上下階間の物理的遮蔽は未実装です。</p>
      </figure>
      <figure className="geometry-figure">
        <figcaption><strong>積層断面</strong><span>全階の日射参考線</span></figcaption>
        <svg viewBox={`0 0 420 ${viewHeight}`} role="img" aria-label={`${buildingCase.name}の複数階断面`}>
          <title>{`${buildingCase.name}の積層断面`}</title>
          <defs><clipPath id={clipId}><rect x="96" y={drawingTop} width="200" height={viewHeight - drawingTop - 8} /></clipPath></defs>
          <text className="gutter-heading" x="12" y="17">階名称</text><text className="gutter-heading" x="316" y="17">階高</text>
          <line className="drawing-line wall" x1={wallX} x2={wallX} y1={drawingTop} y2={drawingBottom} />
          {positioned.map(({ floor, baseZM, topZM }) => <g key={floor.id} className={!report && floor.id === selected ? "selected-floor" : undefined}>
            <line className="drawing-line datum" x1="96" x2="296" y1={zToY(baseZM)} y2={zToY(baseZM)} />
            <rect className="opening-fill" x={wallX - 6} y={zToY(baseZM + floor.opening.sillHeightM + floor.opening.heightM)} width="12" height={floor.opening.heightM * zScale} />
            {floor.overhang === undefined ? null : <line className="drawing-line overhang-line" x1={wallX - floor.overhang.depthM * depthScale} x2={wallX} y1={zToY(baseZM + floor.overhang.elevationM)} y2={zToY(baseZM + floor.overhang.elevationM)} />}
            {gutter(floor, baseZM, topZM)}
          </g>)}
          <g clipPath={`url(#${clipId})`}>
            {references.map(({ floorId, reference, startZM, rawIntersectionZM, depthM, displayEndZM, displayEndDepthM, wasFloorClipped }) => <line key={`${floorId}-${reference.season}`} data-floor-id={floorId} data-start-z={startZM} data-raw-intersection-z={rawIntersectionZM} data-display-end-z={displayEndZM} data-display-end-depth={displayEndDepthM} data-floor-clipped={wasFloorClipped} className={`solar-reference-ray ${reference.season}${!report && floorId === selected ? " selected-ray" : ""}`} x1={wallX - depthM * depthScale} x2={wallX - displayEndDepthM * depthScale} y1={zToY(startZM)} y2={zToY(displayEndZM)}><title>{`${buildingCase.floors.find((floor) => floor.id === floorId)?.name} · ${reference.dateLabel}`}</title></line>)}
          </g>
        </svg>
        <ul className="solar-ray-legend" aria-label="日射参考線の凡例"><li><span className="summer" />6/21</li><li><span className="winter" />12/21</li></ul>
        <p className="solar-reference-disclaimer">各階の6/21・12/21参考日射線を表示します。庇なし・背面入射の階は対象外です。参考日射線は各階の表示範囲内で区切っています。上下階の庇による相互遮蔽を計算した線ではありません。</p>
      </figure>
    </div>
  );
}
