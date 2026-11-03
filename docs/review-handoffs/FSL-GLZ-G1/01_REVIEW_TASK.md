# 公開commitの確認とHuman Acceptance

**独立担当者**は実装・修正への関与を申告し、READ-ONLYで次を確認する。

1. GitHubからfeature PRのhead、base、Draft、merge状態、コミット数、変更ファイル、競合とchecksを取得する。証拠索引にある39件とこのディレクトリの5件が対象。差が出た場合は該当ファイルと影響を報告する。
2. 公開commitのblobを索引のGit SHA-256と照合し、指定の改行変換でR3時点のSHA-256を復元する。コードは `src/glazing/`、画面は `src/app/components/glazing/`、ファイルI/Oは `src/app/glazing-file.ts` から追える。[証拠索引](02_EVIDENCE_INDEX.md)
3. 独立したコピーでlockfileに従って依存を用意する。全体テスト、typecheck、build、Golden、全依存とproduction依存それぞれのaudit、依存ツリー、差分空白を測定する。件数には外部参照SKIPを別掲する。

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run golden:check
npm audit
npm audit --omit=dev
npm ls --all
git diff --check 56a0f19eb4103c5231f09ec1c79dcfe2f782d783...HEAD
```

4. 合成入力で遅延した追加操作の後に別Workspaceを明示適用する。古い完了がentries、selected ID、snapshot、revision、STALEを変えないか確認する。URL検証では、生の不正UTF-8、正しく符号化したliteral percent、隣接する隠し資格情報・制御文字、8段と9段を比較する。旧serializer再生成fixtureの出典と再保存bytesを検証する。
5. 結果は「今回の独立実測」「ローカル証拠の要約」「未実施」に分ける。ソースを取得できない場合は `CODE_NOT_AVAILABLE`、相違があれば `REQUIRED FIX` または `BLOCKED` と理由を記録する。R3のFocused判定とG1全体の受理は別に記録する。

**Human UX担当者**は対象head・ブラウザ・画面幅を記録し、手入力と自分で選んだ合成JSONで1〜4案を比較する。UNKNOWNと0、UgとUw、反射率の方向、出典・構成と改訂番号を識別できるか確認する。入力変更から再計算、未解決の旧版の再照合、保存した実ファイルの再読込・明示適用を試す。390pxとキーボードで確認・取消・保存まで操作し、期待結果と実際の差を記録する。

AC24を再評価するときは、操作時刻、consoleとpageerrorの区別、source、stack、機能への影響を記録する。過去事象の帰属はHumanと独立担当が判断する。AC26はM11統合専用の別Gateで実施する。[未完了Gate](04_DECISIONS.md)
