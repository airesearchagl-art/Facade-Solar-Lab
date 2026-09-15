import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { App } from "../src/app/App";
import { GUIDE_MODEL_IDENTITY } from "../src/app/guide-contract";
import { UserGuide } from "../src/app/components/UserGuide";
import {
  DEFAULT_FACADE_V1_PERIODS,
  calculateSolarPosition,
  FACADE_V1_DIFFUSE_SHADING_MODEL,
  FACADE_V1_DIRECT_SHADING_MODEL,
  FACADE_V1_GROUND_REFLECTION_MODEL,
} from "../src/engine";
import { FACADE_V2_DIRECT_SHADING_MODEL } from "../src/engine/facade-v2";
import { MAX_INTERMEDIATE_FINS } from "../src/geometry/facade-v2";

const html = renderToStaticMarkup(<UserGuide onNavigate={() => undefined} />);

describe("M8 in-app user guide", () => {
  it("renders every primary chapter and the explicit workspace routes", () => {
    for (const chapter of ["3分で試す", "単一階と複数階の使い分け", "入力パラメータ辞典", "設計検討の組み立て方", "結果の読み方", "保存・出力", "技術詳細", "適用範囲"]) {
      expect(html).toContain(chapter);
    }
    const app = renderToString(<App />);
    expect(app).toContain("使い方・技術情報");
    expect(app).toContain('data-workspace="single"');
    expect(app).toContain('data-workspace="multi"');
    expect(app).toContain('data-workspace="guide"');
    expect(app).toContain("デモ比較を試す");
    expect(app).toContain("複数階デモを試す");
  });

  it("covers the required parameter dictionary and centred pitch example", () => {
    for (const label of ["EPW", "Time zone", "ファサード方位角", "開口中心 X", "腰壁高さ（Multi）", "階高（Multi）", "庇の出", "左フィン / 右フィン", "ピッチ指定", "枚数指定", "実配置枚数", "左右端部余白", "SHGC（日射熱取得率）", "地面反射率"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("開口幅6m / 中心ピッチ1.5m");
    expect(html).toContain("0.75 / 2.25 / 3.75 / 5.25 m");
    expect(html).toContain("clear spacingではありません");
    expect(html).toContain(`最大${MAX_INTERMEDIATE_FINS}枚`);
  });

  it("derives technical identity and periods from canonical engine exports", () => {
    const actualSolarPosition = calculateSolarPosition({
      location: { latitudeDeg: 35, longitudeDeg: 139, timeZoneOffsetHours: 9 },
      localStandardTime: { year: 2026, month: 6, day: 21, minuteOfDay: 720 },
    });
    expect(GUIDE_MODEL_IDENTITY).toMatchObject({
      solarPosition: actualSolarPosition.algorithm,
      directV1: FACADE_V1_DIRECT_SHADING_MODEL,
      directV2: FACADE_V2_DIRECT_SHADING_MODEL,
      diffuse: FACADE_V1_DIFFUSE_SHADING_MODEL,
      ground: FACADE_V1_GROUND_REFLECTION_MODEL,
      maxIntermediateFins: MAX_INTERMEDIATE_FINS,
    });
    expect(GUIDE_MODEL_IDENTITY.summerMonths).toEqual(DEFAULT_FACADE_V1_PERIODS.coolingMonths);
    expect(GUIDE_MODEL_IDENTITY.winterMonths).toEqual(DEFAULT_FACADE_V1_PERIODS.heatingMonths);
    for (const identifier of [actualSolarPosition.algorithm, FACADE_V1_DIRECT_SHADING_MODEL, FACADE_V2_DIRECT_SHADING_MODEL, FACADE_V1_DIFFUSE_SHADING_MODEL, FACADE_V1_GROUND_REFLECTION_MODEL]) {
      expect(html).toContain(identifier);
    }
  });

  it("explains result semantics, synthetic weather, M5 status, and critical limitations", () => {
    for (const text of ["庇 + 有効な端部・中間フィンによる複合遮蔽後", "遮蔽物がないreference", "基準案より日射熱取得が小さい", "simple sum", "synthetic demoは実測気象ではなく", "HVAC cooling/heating load", "BEI / equipment sizing", "Radiance / EnergyPlus / SPA: NOT_RUN", "EXTERNAL_REFERENCE_PENDING"]) {
      expect(html).toContain(text);
    }
  });

  it("uses one h1, semantic chapter headings, unique ids, labelled navigation, and keyboard-native controls", () => {
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
    expect((html.match(/<h2/g) ?? []).length).toBeGreaterThanOrEqual(8);
    expect(html.indexOf("<h1")).toBeLessThan(html.indexOf("<h2"));
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    const appHtml = renderToString(<App />);
    const appIds = [...appHtml.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(appIds).size).toBe(appIds.length);
    expect(html).toContain('aria-label="使い方・技術情報の目次"');
    expect(html).toContain('href="#guide-parameters"');
    expect(html).toContain("<details>");
    expect(html).toContain('type="button"');
    expect(html).not.toContain('tabindex="-1"');
  });

  it("marks the full manual, diagrams, formula, and print action without hiding content in markup", () => {
    expect(html).toContain('class="guide-page"');
    expect(html).toContain("このマニュアルを印刷 / PDF保存");
    expect(html).toContain('class="guide-diagram"');
    expect(html).toContain('class="guide-formula"');
    expect(html).toContain('class="technical-details"');
    expect(html).not.toContain('aria-hidden="true"><h');
  });
});
