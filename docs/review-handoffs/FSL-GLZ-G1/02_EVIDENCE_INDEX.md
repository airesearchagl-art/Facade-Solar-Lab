# 証拠索引 · 2026-11-03 JST

| 証拠・帰属 | 実測・識別 | 入手区分 |
|---|---|---|
| 実装・合成テスト・5つの旧serializer再生成fixture | このfeature commitの39ファイル。下表にSHA-256を掲載 | PUBLIC_IN_GIT |
| G0設計正本 | v0.3、SHA-256 b8bc67b7e48cecf5342be5d30de4ae9c8ae0355b9dd055fcbff0f7fc1b906e0c。Human H1で正式受理 | LOCAL_ONLY |
| 作者H1のレビュー用パッケージ | 1,964,487 bytes、134 entries、SHA-256 040a2849177429ba8c302d888b6704d1ce3eff317f37f6477a54dd6d7d50559b。独立R3がCRC・133件のhash・292件の再構築を確認 | LOCAL_ONLY |
| 作者のH1実測 | Focused URL 71、Focused G1 127、Full 788 PASS / 10 SKIP。追加プローブ724例は別集計 | テストはPUBLIC_IN_GIT、過去ログはLOCAL_ONLY |
| 独立R3・FSL-GLZ-G1-IR-001RRR | A. PASS。独立コピーで52 test files、788 PASS / 10 external-reference SKIP / 0 FAIL、typecheck・build・Golden・npm ls・diff check成功、両audit 0 | 独立結果の要約はPUBLIC_IN_GIT、実行ログはLOCAL_ONLY |
| 独立R3の追加反例 | 203/203（正常44、拒否159）。旧v1 fixture 5/5で出典・digest・再保存bytes一致 | fixtureはPUBLIC_IN_GIT、独立プローブのログはLOCAL_ONLY |
| 作者Browser | RecoveryでB01〜B12が12 PASS。H1では混在credentialの拒否、正常キーの保存・再読込・明示適用・Currentを確認。保存5,249 bytes、SHA-256 759ef083f5c82475b72ac75d2bca9e6c9fd44bb331873a4034ce5a6d8d4f56e9 | LOCAL_ONLY |
| 独立R3 Browser | 混在credential拒否後、正常URLの実ファイル再選択・明示適用・U2・VR出典・Currentを確認。保存5,266 bytes、SHA-256 d7356fd4adc5023d0039703d609e906e3f4290a5e5ee8bd6dc9ffee5132ba300 | LOCAL_ONLY |
| H4公開担当のcommit前再実測 | 2026-11-03T13:48:43.489450Z、Node v24.15.0 / npm 11.12.1。52 test files、788 PASS / 10 SKIP / 0 FAIL、typecheck・build・Golden・npm ls成功、全依存とproduction依存のauditは各0。staged diffも空白検査対象 | 要約はPUBLIC_IN_GIT、原ログはLOCAL_ONLY |
| H4公開安全検査 | 39件をtracked/untracked双方とも全文検査し、追加Markdownを含めてindexを再検査。非公開研究レコード11件の識別値を照合。合成の拒否テスト文字列、公開npm registry URL、lockのintegrityを区別 | 対象ソースはPUBLIC_IN_GIT、私的比較資料はLOCAL_ONLY |
| AC26 / 外部物理検証 | M11統合回帰、M5外部参照 | NOT_RUN |

公開資料に含むのはソース、合成fixture、結果の要約とhash。研究表やローカル証拠ZIPの配布は承認範囲外。R3 Focused判定の範囲とAC24の留保は[Findings](03_FINDINGS.md)を参照。

## R3ソースmanifest

固定base **56a0f19eb4103c5231f09ec1c79dcfe2f782d783** と以下の39件がR3の対象。H4追加文書5件はこのmanifestの外にある。Git blob欄はGitオブジェクトIDではなく格納内容のSHA-256。リポジトリの改行属性で12件がLF化されるため、R3原bytesへ戻す方法も表に示す。「同一」はblobをそのまま使用、「CRLF」はLFをCRLFへ戻す。照合用JSONはパス昇順、UTF-8、2空白indent、末尾LF。R3 manifest SHA-256は 356dc46535c6f42f3e31a9279a1349dd8472f6a60fd0bd1d6f331883f1fbab71。

| 相対パス | R3作業ファイルSHA-256 | 公開Git blob内容SHA-256 | 復元 |
|---|---|---|---|
| `package-lock.json` | `1da6d6476f86abb7ca062c8895f2a6bcc3c7c1ad10e8db1e765ee0b6d9acbf10` | `ade36dceb29d6057247bb19f4a72074fbee4b70fee9dbe26f380f296929bb1e1` | CRLF |
| `package.json` | `884edd948ee68abedd51468e53d6a5d7cda5bead3b4f47dd414a84eaf29093db` | `558d5452e43a9b42ba9bc6306e0fd14560d74e269262d73a6c60e446a96302cf` | CRLF |
| `src/app/App.tsx` | `0fd59936325c1a9e071d5403f3bf9c340668dcf1608e3ba31d01cbed15c5649f` | `b4a3b283cb4f4ce6350b451e214678d15e492bb3a55deadede0bfa8db91066cb` | CRLF |
| `src/app/components/UserGuide.tsx` | `1c34b2dfcc5bd4bceb87ee0f9ed83d2f0763715a659d970c6bbf67f06155b598` | `22be068c360ceeff2f7332b40872ccf055a7d59a53e6a3b61d7a0ae13912868f` | CRLF |
| `src/app/components/glazing/GlazingComparisonTable.tsx` | `dfb499e4888225dc707d50fbb261247208f10fa81842c6a90adc802342808ed1` | `dfb499e4888225dc707d50fbb261247208f10fa81842c6a90adc802342808ed1` | 同一 |
| `src/app/components/glazing/GlazingEntryEditor.tsx` | `072a5a26bfb76dba3070853def81fbb1215ee9f0b33840a505cfc18cb681ef97` | `072a5a26bfb76dba3070853def81fbb1215ee9f0b33840a505cfc18cb681ef97` | 同一 |
| `src/app/components/glazing/GlazingEvidenceDetails.tsx` | `75fa753ad2b5ce781b5cffda0e9b3ef67759c17b2c4a9336dd841f1da0af11ed` | `75fa753ad2b5ce781b5cffda0e9b3ef67759c17b2c4a9336dd841f1da0af11ed` | 同一 |
| `src/app/components/glazing/GlazingImportReview.tsx` | `98278006df521d45a8b3412c2bb9e6718ebd9e6eaf7dbc1b48795d305d54b4c9` | `98278006df521d45a8b3412c2bb9e6718ebd9e6eaf7dbc1b48795d305d54b4c9` | 同一 |
| `src/app/components/glazing/GlazingWorkspace.tsx` | `84d2b90c15705dc4aece4998d08250a31a1c7f30b2097011946c8562c85a78eb` | `84d2b90c15705dc4aece4998d08250a31a1c7f30b2097011946c8562c85a78eb` | 同一 |
| `src/app/glazing-file.ts` | `5a5e25dfb2279cf8dea38d795c4fe36cad68449d6356d1848d1be36da3b6ba3d` | `5a5e25dfb2279cf8dea38d795c4fe36cad68449d6356d1848d1be36da3b6ba3d` | 同一 |
| `src/app/glazing.css` | `4c5704e99c77f14b12f06cf12fbef1e4f5f2a1b30c5cb5c8bf450880b7278397` | `4c5704e99c77f14b12f06cf12fbef1e4f5f2a1b30c5cb5c8bf450880b7278397` | 同一 |
| `src/app/styles.css` | `816cc0504a62554e0a05cca287e83495b89cdee2e33a5078c78795e74d3947d0` | `d87c07cd999ea7a1c3b2d1c2c2861928b3366f44f3a315064b3426a61fa7869b` | CRLF |
| `src/app/workspace-navigation.ts` | `c66e3af429e43b33f3f0c7d287873e121080ae956160886fbbd5f80b2ba35a56` | `1ce155dd1b24389fd5fce4d568ea754f49416d16f5249415f065fdc085ff537b` | CRLF |
| `src/glazing/canonical.ts` | `6ca41d6a551c5c84f15d75812dfa4708a0553e3ddc1930c597c8a79dd651ead6` | `6ca41d6a551c5c84f15d75812dfa4708a0553e3ddc1930c597c8a79dd651ead6` | 同一 |
| `src/glazing/digest.ts` | `d8f8894d58f7b8f2d76edb8a26191127d84b2dfe1c12eed08fc4bbc8ab905449` | `d8f8894d58f7b8f2d76edb8a26191127d84b2dfe1c12eed08fc4bbc8ab905449` | 同一 |
| `src/glazing/index.ts` | `0709b0060dc304bcbf99317456ea32ef773b0247e6969fd6092a018d44e4aba9` | `0709b0060dc304bcbf99317456ea32ef773b0247e6969fd6092a018d44e4aba9` | 同一 |
| `src/glazing/json.ts` | `962d4b51334da8003abacb6b9db5a018e82b3e422400da7cb0755833abf31eee` | `962d4b51334da8003abacb6b9db5a018e82b3e422400da7cb0755833abf31eee` | 同一 |
| `src/glazing/resolution.ts` | `e037c0dfa384c5e5df637d8f20f96ae64289fec269269eb0f13fb57501223dbf` | `e037c0dfa384c5e5df637d8f20f96ae64289fec269269eb0f13fb57501223dbf` | 同一 |
| `src/glazing/strict-json.ts` | `8ed72cd3f650b7b9645e55d347ea3abc89f5c6ab95ee47f1115efb2c8ede54b7` | `8ed72cd3f650b7b9645e55d347ea3abc89f5c6ab95ee47f1115efb2c8ede54b7` | 同一 |
| `src/glazing/types.ts` | `e8c4b6e54a7e7ecd75810a42d2e3600e20823e5adb6f4ed09575dcdef9a50099` | `e8c4b6e54a7e7ecd75810a42d2e3600e20823e5adb6f4ed09575dcdef9a50099` | 同一 |
| `src/glazing/user-entry.ts` | `23926172d84a290f6eaa936d6d0e08d3f51f704a95c6cbbc6294fafa216afb10` | `23926172d84a290f6eaa936d6d0e08d3f51f704a95c6cbbc6294fafa216afb10` | 同一 |
| `src/glazing/validation.ts` | `8e543a0b04ea441f255b28ee5623a7910ef546c906cced4ce76a56218e60e060` | `2b074a99dc01a452b875f82bdbc68d7f559f68d4feece4c62427542e6fbb9ae7` | CRLF |
| `src/glazing/workspace.ts` | `2c4fc30b6111b1ba30fe077dd34c74948fd5ee2dd4f6b914ba74a65e9823a579` | `2c4fc30b6111b1ba30fe077dd34c74948fd5ee2dd4f6b914ba74a65e9823a579` | 同一 |
| `tests/glazing-acceptance.test.ts` | `4f49caa6fa71dc5455721131c9141ec09688f2e4c6a7f5edceb463a0f1bb553b` | `4f49caa6fa71dc5455721131c9141ec09688f2e4c6a7f5edceb463a0f1bb553b` | 同一 |
| `tests/glazing-boundary.test.ts` | `7cc5d679f8b305ccb04d99ec7b2c674e933478034d166a29a8751a83a791a806` | `7cc5d679f8b305ccb04d99ec7b2c674e933478034d166a29a8751a83a791a806` | 同一 |
| `tests/glazing-core.test.ts` | `75c3756565223ec8c6b44ec86f8b9beaa26b58802d512b6125286a21991acf6b` | `ea599847e501e1d8c26ac4c8bb5b93bc24956d9902dcdc1f070b79e7a00aecee` | CRLF |
| `tests/glazing-fixture.ts` | `a5bc6b4c2c2035a07ed28ec742cd3ce6add1e60aee810d182d581d12091f95d4` | `a5bc6b4c2c2035a07ed28ec742cd3ce6add1e60aee810d182d581d12091f95d4` | 同一 |
| `tests/glazing-ir-async.test.tsx` | `5cc6db7e87409f2bcc3511800c004314de4cabbdc1d7c33eb903e9db323920d5` | `5cc6db7e87409f2bcc3511800c004314de4cabbdc1d7c33eb903e9db323920d5` | 同一 |
| `tests/glazing-ir-fixture-raw.d.ts` | `9804fa08b3bf8146cc0cdf250a1e2837f37bad25a9b81ba29a5163b6818a0e73` | `9804fa08b3bf8146cc0cdf250a1e2837f37bad25a9b81ba29a5163b6818a0e73` | 同一 |
| `tests/glazing-ir-legacy-v1-discount.json` | `068d0093cc2d778f343a781626768815d719eea7f877579da21dff2b6e4db0af` | `068d0093cc2d778f343a781626768815d719eea7f877579da21dff2b6e4db0af` | 同一 |
| `tests/glazing-ir-legacy-v1-japanese.json` | `cf7440ab136002c85ccdeb6e05d3cd3beda88ae1e50d4387c01de0dfc2beb9f2` | `cf7440ab136002c85ccdeb6e05d3cd3beda88ae1e50d4387c01de0dfc2beb9f2` | 同一 |
| `tests/glazing-ir-legacy-v1-mark-ab-space.json` | `b57496292970aca3ee662f31b7b5b2d674531da87df19c2c8c9dce158633ed92` | `b57496292970aca3ee662f31b7b5b2d674531da87df19c2c8c9dce158633ed92` | 同一 |
| `tests/glazing-ir-legacy-v1-mark-ab.json` | `a730758433291d25242bf134029ae5b800f9cc7ca43eb6f809fce326bd5fe9c3` | `a730758433291d25242bf134029ae5b800f9cc7ca43eb6f809fce326bd5fe9c3` | 同一 |
| `tests/glazing-ir-legacy-v1-mark-c3.json` | `ebe5af4bb682eb19f4600612bfeedaa87a572bdeeabb8ccf5c0b37ba8e2a8a7f` | `ebe5af4bb682eb19f4600612bfeedaa87a572bdeeabb8ccf5c0b37ba8e2a8a7f` | 同一 |
| `tests/glazing-ir-url.test.ts` | `0ee910bcb1553dc8e97209d02bb98a44a7ef47b418524f6a67423a6381d5fd71` | `0ee910bcb1553dc8e97209d02bb98a44a7ef47b418524f6a67423a6381d5fd71` | 同一 |
| `tests/glazing-json.test.ts` | `8017622c7b8707656b9b7cfbeb7f000219f156c8156068cc1ddc685c6f982b0f` | `93d3d9818deab87a77081788f0afc9af4d1391fa7f687f0a8ea371ad2234a4f4` | CRLF |
| `tests/glazing-node-oracle.d.mts` | `73f29be3dda60f3d2425ec42975799edc95f4d1bcb73e48c2afcd7cdd78317c2` | `45e728b72ff244567cc459bd6042b6dca6b20a9a321ad520d69cf9a02d825968` | CRLF |
| `tests/glazing-node-oracle.mjs` | `936a77fa094b0a166ee3edf701870223bd62e00d5bfe1f47cb88d256fe5ca2c4` | `e3372b7c85ad25dd3fe3a3af7bd59ad3042ca354a215116ce9ca3949678cd420` | CRLF |
| `tests/glazing-workspace.test.ts` | `2628f94e6c55ef295237e1f2d852b623657ac94e6c95e37ac175e2806addde33` | `24d5a9d6fb5f415f4eef33aa576d053160b9d8b69ddbd3b2ac46dd2dca17f1cb` | CRLF |

## 公開headからの照合手順

対象PRの厳密なheadを取得してそのcommitをcheckoutした独立コピーで、以下をリポジトリ直下から実行する。

```python
from pathlib import Path
import hashlib, json, re, subprocess

index = Path('docs/review-handoffs/FSL-GLZ-G1/02_EVIDENCE_INDEX.md').read_text(encoding='utf-8')
rows = re.findall(r'^\| `([^`]+)` \| `([0-9a-f]{64})` \| `([0-9a-f]{64})` \| (同一|CRLF) \|$', index, re.M)
assert len(rows) == 39
manifest = {}
for path, reviewed, stored, ending in rows:
    blob = subprocess.check_output(['git', 'show', 'HEAD:' + path])
    assert hashlib.sha256(blob).hexdigest() == stored, path
    original = blob.replace(b'\n', b'\r\n') if ending == 'CRLF' else blob
    manifest[path] = hashlib.sha256(original).hexdigest()
    assert manifest[path] == reviewed, path
payload = (json.dumps(manifest, sort_keys=True, indent=2) + '\n').encode('utf-8')
assert hashlib.sha256(payload).hexdigest() == '356dc46535c6f42f3e31a9279a1349dd8472f6a60fd0bd1d6f331883f1fbab71'
print('39/39 verified')
```
