import { useMemo } from "react";

import type { MultiFloorCase } from "../../multifloor";
import { createFacadeSolsticeReferences } from "../../solar-reference";
import type { WeatherDataset } from "../../weather";

interface MultiFloorGeometryPreviewProps {
  readonly buildingCase: MultiFloorCase;
  readonly selectedFloorId?: string;
  readonly dataset: WeatherDataset | null;
  readonly report?: boolean;
}
interface PositionedFloor {
  readonly floor: MultiFloorCase["floors"][number];
  readonly baseZM: number;
  readonly topZM: number;
}

function positionedFloors(buildingCase: MultiFloorCase): readonly PositionedFloor[] {
  let baseZM = 0;
  return buildingCase.floors.map((floor) => {
    const item = { floor, baseZM, topZM: baseZM + floor.floorHeightM };
    baseZM = item.topZM;
    return item;
  });
}

export function MultiFloorGeometryPreview({
  buildingCase,
  selectedFloorId,
  dataset,
  report = false,
}: MultiFloorGeometryPreviewProps) {
  const positioned = useMemo(() => positionedFloors(buildingCase), [buildingCase]);
  const selected = positioned.find((item) => item.floor.id === selectedFloorId) ?? positioned[0];
  const totalHeight = positioned.at(-1)?.topZM ?? 0;
  const geometryValid =
    totalHeight > 0 &&
    positioned.every(({ floor }) =>
      Number.isFinite(floor.floorHeightM) &&
      floor.floorHeightM > 0 &&
      Number.isFinite(floor.opening.widthM) &&
      floor.opening.widthM > 0 &&
      Number.isFinite(floor.opening.heightM) &&
      floor.opening.heightM > 0 &&
      Number.isFinite(floor.opening.sillHeightM),
    );
  const solarReferences = useMemo(() => {
    if (!geometryValid || dataset === null || selected?.floor.overhang === undefined) return [];
    const overhang = selected.floor.overhang;
    return createFacadeSolsticeReferences({
      dataset,
      facadeAzimuthDegFromNorth: buildingCase.facadeAzimuthDegFromNorth,
      overhang: {
        depthM: overhang.depthM,
        elevationZM: overhang.elevationM,
        leftExtensionM: overhang.leftExtensionM,
        rightExtensionM: overhang.rightExtensionM,
      },
    });
  }, [buildingCase.facadeAzimuthDegFromNorth, dataset, geometryValid, selected]);

  if (!geometryValid) {
    return <div className="geometry-empty" role="status">形状入力を修正すると積層図を表示します。</div>;
  }

  const viewHeight = report ? 310 : 390;
  const drawingTop = 24;
  const drawingBottom = viewHeight - 38;
  const zScale = (drawingBottom - drawingTop) / totalHeight;
  const zToY = (z: number) => drawingBottom - z * zScale;
  const maxOpeningWidth = Math.max(...positioned.map(({ floor }) => floor.opening.widthM), 1);
  const xScale = Math.min(34, 220 / maxOpeningWidth);
  const depthScale = Math.min(46, 100 / Math.max(1, ...positioned.map(({ floor }) => floor.overhang?.depthM ?? 0)));
  const wallX = 190;

  return (
    <div className={report ? "multifloor-geometry report" : "multifloor-geometry"}>
      <figure className="geometry-figure">
        <figcaption><strong>積層立面</strong><span>累積建物高さ {totalHeight.toFixed(2)} m</span></figcaption>
        <svg viewBox={`0 0 360 ${viewHeight}`} role="img" aria-label={`${buildingCase.name}の複数階立面`}>
          <title>{`${buildingCase.name}の積層立面`}</title>
          <rect className="wall-fill" x="28" y={drawingTop} width="304" height={drawingBottom - drawingTop} />
          {positioned.map(({ floor, baseZM, topZM }) => {
            const openingTopZ = baseZM + floor.opening.sillHeightM + floor.opening.heightM;
            const openingBottomZ = baseZM + floor.opening.sillHeightM;
            const width = floor.opening.widthM * xScale;
            const left = 180 - width / 2;
            const overhang = floor.overhang;
            return (
              <g key={floor.id} className={floor.id === selected?.floor.id ? "selected-floor" : undefined}>
                <line className="drawing-line datum" x1="28" x2="332" y1={zToY(baseZM)} y2={zToY(baseZM)} />
                <text x="34" y={zToY(baseZM) - 7}>{floor.name}</text>
                <rect className="opening-fill front-opening" x={left} y={zToY(openingTopZ)} width={width} height={zToY(openingBottomZ) - zToY(openingTopZ)} />
                {overhang === undefined ? null : (
                  <line className="drawing-line overhang-line" x1={left - overhang.leftExtensionM * xScale} x2={left + width + overhang.rightExtensionM * xScale} y1={zToY(baseZM + overhang.elevationM)} y2={zToY(baseZM + overhang.elevationM)} />
                )}
                <title>{`${floor.name}: 階高 ${floor.floorHeightM} m / 開口 ${floor.opening.widthM} × ${floor.opening.heightM} m`}</title>
                {topZM === totalHeight ? <line className="drawing-line datum" x1="28" x2="332" y1={zToY(topZM)} y2={zToY(topZM)} /> : null}
              </g>
            );
          })}
          <text x="328" y={drawingTop - 8} textAnchor="end">最高高さ {totalHeight.toFixed(2)} m</text>
        </svg>
      </figure>

      <figure className="geometry-figure">
        <figcaption><strong>積層断面</strong><span>{selected === undefined ? "" : `${selected.floor.name}を選択中`}</span></figcaption>
        <svg viewBox={`0 0 360 ${viewHeight}`} role="img" aria-label={`${buildingCase.name}の複数階断面`}>
          <title>{`${buildingCase.name}の積層断面`}</title>
          <line className="drawing-line wall" x1={wallX} x2={wallX} y1={drawingTop} y2={drawingBottom} />
          {positioned.map(({ floor, baseZM, topZM }) => {
            const openingTopZ = baseZM + floor.opening.sillHeightM + floor.opening.heightM;
            const openingBottomZ = baseZM + floor.opening.sillHeightM;
            const overhang = floor.overhang;
            return (
              <g key={floor.id} className={floor.id === selected?.floor.id ? "selected-floor" : undefined}>
                <line className="drawing-line datum" x1="38" x2="320" y1={zToY(baseZM)} y2={zToY(baseZM)} />
                <rect className="opening-fill" x={wallX - 7} y={zToY(openingTopZ)} width="14" height={zToY(openingBottomZ) - zToY(openingTopZ)} />
                {overhang === undefined ? null : (
                  <line className="drawing-line overhang-line" x1={wallX - overhang.depthM * depthScale} x2={wallX} y1={zToY(baseZM + overhang.elevationM)} y2={zToY(baseZM + overhang.elevationM)} />
                )}
                <text x="204" y={zToY(baseZM) - 7}>{floor.name} · 階高 {floor.floorHeightM.toFixed(2)} m</text>
                {topZM === totalHeight ? <line className="drawing-line datum" x1="38" x2="320" y1={zToY(topZM)} y2={zToY(topZM)} /> : null}
              </g>
            );
          })}
          {selected?.floor.overhang === undefined ? null : solarReferences.map((reference) => {
            const localIntersection = reference.overhangTipFacadeIntersectionZM;
            if (!reference.frontFacing || localIntersection === null) return null;
            const overhang = selected.floor.overhang!;
            return (
              <line
                key={reference.season}
                className={`solar-reference-ray ${reference.season}`}
                x1={wallX - overhang.depthM * depthScale}
                x2={wallX}
                y1={zToY(selected.baseZM + overhang.elevationM)}
                y2={zToY(selected.baseZM + localIntersection)}
              />
            );
          })}
        </svg>
        {selected === undefined || dataset === null ? null : (
          <p className="solar-reference-disclaimer">選択階の6/21・12/21参考日射線のみを表示します。年間計算は各階でcanonical engineを実行します。</p>
        )}
      </figure>
    </div>
  );
}
