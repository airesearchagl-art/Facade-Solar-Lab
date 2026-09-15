import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { App } from "../src/app/App";

describe("M8 application shell", () => {
  it("server-renders mounted Japanese-first single, multi, and guide workspaces", () => {
    const html = renderToString(<App />);
    expect(html).toContain("単一階モード");
    expect(html).toContain("複数階モード");
    expect(html).toContain("使い方・技術情報");
    expect(html).toContain("複数案比較");
    expect(html).toContain("デモ比較を試す");
    expect(html).toContain("サンプル気象データを使って、2つのファサード案の比較をすぐに確認できます。");
    expect(html).toContain("合成気象データ");
    expect(html).toContain("実測気象ではありません");
    expect(html).toContain("性能検証用データではありません");
    expect(html).toContain("EPWファイルを読み込む");
    expect(html).toContain("案A");
    expect(html).toContain("基準案");
    expect(html).toContain("比較計算を実行");
    expect(html).toContain("年間");
    expect(html).toContain("夏期");
    expect(html).toContain("冬期");
    expect(html).toContain("断面");
    expect(html).toContain("立面");
    expect(html).toContain("前提条件とデータ出典");
    expect(html).toContain("比較条件を保存・再利用");
    expect(html).toContain("この案をプリセット保存");
    expect(html).toContain("比較セットを保存");
    expect(html).toContain("JSONプリセットを読み込む");
    expect(html).toContain("計算結果と気象ファイルの内容は含みません");
    expect(html).toContain("正式に検証された物理性能値ではありません");
    expect(html).toContain("有限幅の形状計算は直達日射の影だけに適用します");
    expect(html).toContain("複数階比較に使う気象データ");
    expect(html).toContain("複数階デモを試す");
    expect(html).toContain("建物案を追加");
    expect(html).toContain("Floor追加");
    expect(html).toContain("複数階比較を実行");
    expect(html).toContain("積層立面");
    expect(html).toContain("積層断面");
    expect(html).toContain("各Floorを既存");
    expect(html).toContain("facade-v1-weather");
    expect(html).not.toContain("M4 · COMPARISON UX");
    expect(html).not.toContain("Try Demo Comparison");
    expect(html).not.toContain("Run Comparison");
  });
});
