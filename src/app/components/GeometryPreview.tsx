import type { ComparisonCase } from "../../comparison";

interface GeometryPreviewProps {
  readonly comparisonCase: ComparisonCase;
}

function finiteGeometry(comparisonCase: ComparisonCase): boolean {
  const { opening, overhang } = comparisonCase.parameters;
  return (
    Number.isFinite(opening.widthM) &&
    opening.widthM > 0 &&
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

export function GeometryPreview({ comparisonCase }: GeometryPreviewProps) {
  if (!finiteGeometry(comparisonCase)) {
    return (
      <div className="geometry-empty" role="status">
        形状入力を修正すると、説明図を再表示します。
      </div>
    );
  }
  const { opening, overhang } = comparisonCase.parameters;
  const openingHeight = opening.headZM - opening.sillZM;
  const maxElevation = Math.max(
    opening.headZM,
    overhang?.elevationZM ?? opening.headZM,
    1,
  );
  const zScale = 132 / maxElevation;
  const floorY = 174;
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
          <text x="184" y={openingTop + 4}>上端 {opening.headZM.toFixed(2)} m</text>
          <text x="184" y={openingBottom + 4}>下端 {opening.sillZM.toFixed(2)} m</text>
          <text x="28" y="194">基準高さ 0.00 m</text>
          <text x="28" y="28">開口高 H {openingHeight.toFixed(2)} m</text>
          {overhang !== undefined ? (
            <>
              <text x="28" y={zToY(overhang.elevationZM) - 8}>
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
            y="70"
            width={openingWidthPx}
            height="84"
          />
          {overhang !== undefined ? (
            <line
              className="drawing-line overhang-line"
              x1={openingLeft - extensionLeft}
              x2={openingLeft + openingWidthPx + extensionRight}
              y1="56"
              y2="56"
            />
          ) : null}
          <line className="dimension-line" x1={openingLeft} x2={openingLeft + openingWidthPx} y1="186" y2="186" />
          <text x="150" y="202" textAnchor="middle">
            開口幅 W {opening.widthM.toFixed(2)} m
          </text>
          {overhang !== undefined ? (
            <>
              <text x="34" y="42">左張出 {overhang.leftExtensionM.toFixed(2)} m</text>
              <text x="266" y="42" textAnchor="end">右張出 {overhang.rightExtensionM.toFixed(2)} m</text>
            </>
          ) : null}
        </svg>
      </figure>
    </div>
  );
}
