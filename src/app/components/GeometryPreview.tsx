import { useMemo } from "react";

import type { ComparisonCase } from "../../comparison";
import {
  createFacadeSolsticeReferences,
  type FacadeSolarReference,
} from "../../solar-reference";
import type { WeatherDataset } from "../../weather";
import { finInputIssues } from "../../comparison/fin-input";
import { FinSummary } from "./FinEditor";

interface GeometryPreviewProps {
  readonly comparisonCase: ComparisonCase;
  readonly dataset: WeatherDataset | null;
}

function finiteGeometry(comparisonCase: ComparisonCase): boolean {
  const { opening, overhang } = comparisonCase.parameters;
  return (
    finInputIssues(comparisonCase.parameters).length === 0 &&
    Number.isFinite(opening.widthM) &&
    opening.widthM > 0 &&
    Number.isFinite(comparisonCase.parameters.facadeAzimuthDegFromNorth) &&
    Number.isFinite(opening.sillZM) &&
    Number.isFinite(opening.headZM) &&
    opening.headZM > opening.sillZM &&
    (overhang === undefined ||
      (Number.isFinite(overhang.depthM) &&
        Number.isFinite(overhang.elevationZM) &&
        Number.isFinite(overhang.leftExtensionM) &&
        Number.isFinite(overhang.rightExtensionM)))
  );
}

function formatTime(minuteOfDay: number): string {
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function intersectionLabel(
  reference: FacadeSolarReference,
  comparisonCase: ComparisonCase,
): string {
  const value = reference.overhangTipFacadeIntersectionZM;
  if (value === null) return "庇先端交点なし";
  if (value > comparisonCase.parameters.opening.headZM) {
    return `窓上端より上（${value.toFixed(2)} m）`;
  }
  if (value < comparisonCase.parameters.opening.sillZM) {
    return `窓下端より下（${value.toFixed(2)} m）`;
  }
  return `窓内を通過（${value.toFixed(2)} m）`;
}

export function GeometryPreview({ comparisonCase, dataset }: GeometryPreviewProps) {
  const geometryIsFinite = finiteGeometry(comparisonCase);
  const { opening, overhang } = comparisonCase.parameters;
  const solarReferences = useMemo(
    () => !geometryIsFinite || dataset === null
      ? []
      : createFacadeSolsticeReferences({
          dataset,
          facadeAzimuthDegFromNorth: comparisonCase.parameters.facadeAzimuthDegFromNorth,
          ...(overhang === undefined ? {} : { overhang }),
        }),
    [dataset, geometryIsFinite, comparisonCase.parameters.facadeAzimuthDegFromNorth, overhang],
  );
  if (!geometryIsFinite) {
    return (
      <div className="geometry-empty" role="status">
        形状入力を修正すると、説明図を再表示します。
      </div>
    );
  }
  const openingHeight = opening.headZM - opening.sillZM;
  const maxElevation = Math.max(
    opening.headZM,
    overhang?.elevationZM ?? opening.headZM,
    1,
    comparisonCase.parameters.leftFin?.topZM ?? 0,
    comparisonCase.parameters.rightFin?.topZM ?? 0,
  );
  const minElevation = Math.min(0, comparisonCase.parameters.leftFin?.bottomZM ?? 0, comparisonCase.parameters.rightFin?.bottomZM ?? 0);
  const zScale = 132 / (maxElevation - minElevation);
  const floorY = 174 + minElevation * zScale;
  const zToY = (value: number) => floorY - value * zScale;
  const openingTop = zToY(opening.headZM);
  const openingBottom = zToY(opening.sillZM);
  const depthPx = Math.min(92, (overhang?.depthM ?? 0) * 48);

  const frontScale = Math.min(30, 176 / opening.widthM);
  const openingWidthPx = opening.widthM * frontScale;
  const openingLeft = 150 - openingWidthPx / 2;
  const extensionLeft = (overhang?.leftExtensionM ?? 0) * frontScale;
  const extensionRight = (overhang?.rightExtensionM ?? 0) * frontScale;
  return (
    <div className="geometry-grid">
      <figure className="geometry-figure">
        <figcaption>
          <strong>断面</strong>
          <span>形状確認用の模式図（CAD寸法図ではありません）</span>
        </figcaption>
        <svg viewBox="0 0 300 210" role="img" aria-label={`${comparisonCase.name}の断面`}>
          <title>{`${comparisonCase.name}の断面形状`}</title>
          <line className="drawing-line datum" x1="28" x2="274" y1={floorY} y2={floorY} />
          <line className="drawing-line wall" x1="170" x2="170" y1="22" y2={floorY} />
          <rect
            className="opening-fill"
            x="162"
            y={openingTop}
            width="16"
            height={openingBottom - openingTop}
          />
          {overhang !== undefined ? (
            <line
              className="drawing-line overhang-line"
              x1={170 - depthPx}
              x2="170"
              y1={zToY(overhang.elevationZM)}
              y2={zToY(overhang.elevationZM)}
            />
          ) : null}
          {overhang === undefined ? null : solarReferences.map((reference) => {
            const zAtFacade = reference.overhangTipFacadeIntersectionZM;
            if (!reference.frontFacing || zAtFacade === null) return null;
            return (
              <line
                key={reference.season}
                className={`solar-reference-ray ${reference.season}`}
                x1={170 - depthPx}
                x2="170"
                y1={zToY(overhang.elevationZM)}
                y2={zToY(zAtFacade)}
              />
            );
          })}
          {(["leftFin", "rightFin"] as const).map((key) => {
            const fin = comparisonCase.parameters[key];
            if (fin === undefined || fin.depthM === 0) return null;
            const width = Math.min(92, fin.depthM * 48);
            return <rect key={key} className={`fin-projection ${key}`} x={170 - width} width={width} y={zToY(fin.topZM)} height={(fin.topZM - fin.bottomZM) * zScale}><title>{key === "leftFin" ? "左フィン側面投影（断面切断面ではない）" : "右フィン側面投影（断面切断面ではない）"}</title></rect>;
          })}
          <text x="184" y={openingTop + 4}>上端 {opening.headZM.toFixed(2)} m</text>
          <text x="184" y={openingBottom + 4}>下端 {opening.sillZM.toFixed(2)} m</text>
          <text x="28" y="194">基準高さ 0.00 m</text>
          <text x="28" y="28">開口高 H {openingHeight.toFixed(2)} m</text>
          {overhang !== undefined ? (
            <>
              <text x="28" y="44">
                庇の出 D {overhang.depthM.toFixed(2)} m
              </text>
              <text x="184" y={zToY(overhang.elevationZM) - 8}>
                庇高さ z {overhang.elevationZM.toFixed(2)} m
              </text>
            </>
          ) : (
            <text x="28" y="52">庇なし</text>
          )}
        </svg>
        {dataset === null ? (
          <p className="solar-reference-empty">気象データを読み込むと夏至・冬至頃の参考日射線を表示します。</p>
        ) : (
          <div className="solar-reference-details" aria-label="代表日の参考日射線">
            {solarReferences.map((reference) => (
              <div className={`solar-reference-item ${reference.season}`} key={reference.season}>
                <strong>{reference.label}（{reference.dateLabel}）</strong>
                <span>参考時刻 {formatTime(reference.solarNoon.minuteOfDay)}</span>
                <span>太陽高度 {reference.solarNoon.position.elevationDeg.toFixed(1)}°</span>
                {reference.frontFacing && reference.profileAngleDeg !== null ? (
                  <>
                    <span>断面角 {reference.profileAngleDeg.toFixed(1)}°</span>
                    <span>{overhang === undefined ? "庇なし" : intersectionLabel(reference, comparisonCase)}</span>
                  </>
                ) : (
                  <span>この時刻の太陽はファサード背面側です</span>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="solar-reference-disclaimer">参考日射線は選択地点・選択方位に対する代表日の幾何学的な参考表示です。年間日射熱取得計算そのものを置き換えるものではありません。</p>
      </figure>

      <figure className="geometry-figure">
        <figcaption>
          <strong>立面</strong>
          <span>建物外部から正面視</span>
        </figcaption>
        <svg viewBox="0 0 300 210" role="img" aria-label={`${comparisonCase.name}の立面`}>
          <title>{`${comparisonCase.name}の立面形状`}</title>
          <rect className="wall-fill" x="28" y="22" width="244" height="152" />
          <rect
            className="opening-fill front-opening"
            x={openingLeft}
            y={openingTop}
            width={openingWidthPx}
            height={openingBottom - openingTop}
          />
          {overhang !== undefined ? (
            <line
              className="drawing-line overhang-line"
              x1={openingLeft - extensionLeft}
              x2={openingLeft + openingWidthPx + extensionRight}
              y1={zToY(overhang.elevationZM)}
              y2={zToY(overhang.elevationZM)}
            />
          ) : null}
          {(["leftFin", "rightFin"] as const).map((key) => {
            const fin = comparisonCase.parameters[key];
            if (fin === undefined || fin.depthM === 0) return null;
            const x = key === "leftFin" ? openingLeft : openingLeft + openingWidthPx;
            return <line key={key} className={`drawing-line fin-line ${key}`} x1={x} x2={x} y1={zToY(fin.topZM)} y2={zToY(fin.bottomZM)}><title>{key === "leftFin" ? "左フィン" : "右フィン"}</title></line>;
          })}
          <line className="dimension-line" x1={openingLeft} x2={openingLeft + openingWidthPx} y1="186" y2="186" />
          <text x="150" y="202" textAnchor="middle">
            開口幅 W {opening.widthM.toFixed(2)} m
          </text>
          {overhang !== undefined ? (
            <>
              <text x="34" y="30">左張出 {overhang.leftExtensionM.toFixed(2)} m</text>
              <text x="266" y="30" textAnchor="end">右張出 {overhang.rightExtensionM.toFixed(2)} m</text>
            </>
          ) : null}
        </svg>
        <FinSummary fins={comparisonCase.parameters} />
        <p className="field-note">縦線は端部フィン。断面の網掛けは側面投影で、中央断面の切断面ではありません。参考日射線は庇先端基準で、フィン影の輪郭ではありません。</p>
      </figure>
    </div>
  );
}
