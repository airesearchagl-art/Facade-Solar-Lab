# Product Direction

## Purpose

Facade Solar Labは、建物ファサードの形状を変更したときの日射熱取得と遮蔽効果の差を即時に比較し、設計初期の窓・庇計画を支援するWebツールです。

省エネルギー計算softwareそのものや、Humanの設計判断を置き換える最適化engineは目指しません。

## Design loop

```text
形状・条件を変更
  ↓
日射熱取得への影響を確認
  ↓
複数案を比較
  ↓
意匠デザインと日射性能を往復
  ↓
Humanが設計判断
```

## Intended inputs

- 方位: 南・東・西・北・中間方位
- 窓: 下端高さ・上端高さ・高さ・幅
- 腰壁の有無、FLから立ち上がる全面窓
- 庇: 出幅・設置高さ・窓との位置関係
- 将来の庇model: 有限幅・左右張出
- ガラスの日射熱取得性能
- 地点・時刻別気象条件

## Intended outputs

- 年間／夏季／冬季の日射熱取得量
- 庇による遮蔽効果
- 案ごとの差分と比較
- 前提・単位・weather source・validation状態

## Product principles

1. **Fast feedback** — 設計初期の反復を妨げない応答性を優先する。
2. **Comparable assumptions** — 複数案は同じ前提・weather sourceで比較する。
3. **Transparent limitations** — modelの近似、未検証範囲、単位、入力境界を画面と文書に残す。
4. **Engine independence** — 計算engineをReactから分離し、Browser・Node.js・batch validationで再利用する。
5. **Human authority** — 指標を「真の最適値」と誤認させず、判断根拠の一つとして提示する。

## M0 boundary

M0は開発基盤のみです。日射・geometry・weatherの計算値は生成しません。M1以降のmodel実装は、独立したHuman承認とvalidation evidenceを伴って段階的に進めます。
