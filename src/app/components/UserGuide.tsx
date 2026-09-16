import { GUIDE_MODEL_IDENTITY } from "../guide-contract";
import { MAX_STUDY_CANDIDATES, CANDIDATE_GENERATION_VERSION } from "../../explorer/types";
import type { WorkspaceMode } from "../workspace-navigation";

interface ParameterItem {
  readonly name: string;
  readonly unit: string;
  readonly meaning: string;
  readonly effect: string;
  readonly note: string;
}

interface ParameterGroup {
  readonly title: string;
  readonly items: readonly ParameterItem[];
}

const PARAMETER_GROUPS: readonly ParameterGroup[] = [
  {
    title: "気象データ",
    items: [
      { name: "EPW", unit: "—", meaning: "地点・標準時と各時間区間の日射量を含むEnergyPlus Weatherファイルです。", effect: "対象地点や年を変えると、太陽位置と入射日射の時系列が変わります。", note: "ブラウザ内だけで解析し、raw EPW・bytes・local pathは保存しません。" },
      { name: "Demo synthetic weather", unit: "—", meaning: "操作確認用にブラウザ内で生成する8,760区間の合成データです。", effect: "EPWがなくても全操作と比較結果を確認できます。", note: "synthetic demo ≠ 実測気象。性能検証や実建物評価には使えません。" },
      { name: "Location", unit: "度", meaning: "EPWに記録された緯度・経度で太陽位置を決めます。", effect: "緯度・経度が変わると太陽高度・方位の時系列が変わります。", note: "地点情報はEPWヘッダーから読み、手入力では変更しません。" },
      { name: "Time zone", unit: "UTC±h", meaning: "EPWのLocal Standard TimeをUTCへ対応付けます。", effect: "標準時が変わると同じ時刻ラベルに対応する太陽位置が変わります。", note: "DSTや端末のtimezone、JavaScript Dateには依存しません。" },
      { name: "Interval", unit: "Wh/m² interval", meaning: "EPWの日射量は区間積算値で、太陽幾何は区間中点で評価します。", effect: "sub-hourlyでも積算値を時間長で再乗算しません。", note: "欠損・不正な必須日射値は0補完せずエラーにします。" },
      { name: "Partial / full-year", unit: "—", meaning: "full-yearは通年、partialは読み込めた期間だけの集計です。", effect: "partialでは年間換算せず、夏期・冬期も読込区間のみになります。", note: "未読込月の0は日射量ゼロを意味しません。" },
    ],
  },
  {
    title: "ファサード・開口",
    items: [
      { name: "ファサード方位角", unit: "°", meaning: "外向き法線の方位。北=0、東=90、南=180、西=270の時計回りです。", effect: "変更すると直達日射の入射角と遮蔽形状が変わります。", note: "建物の軸角や視線方向と取り違えないでください。" },
      { name: "開口幅", unit: "m", meaning: "1つの矩形開口の水平幅です。", effect: "大きいほど開口面積が増え、同一条件では日射熱取得量が増える傾向です。", note: "各Floorで独立した1開口を扱います。" },
      { name: "開口中心 X", unit: "m", meaning: "facade-local座標の開口中心。現UIでは内部基準のx=0です。", effect: "ユーザー入力では変更せず、庇・フィン位置の基準になります。", note: "正面視で+xは右、壁面はy=0、+yは外向きです。" },
      { name: "開口下端 / 上端", unit: "m", meaning: "Floor床基準の開口下端zと上端zです。", effect: "差が開口高さとなり、庇・フィンとの相対位置を変えます。", note: "上端は下端より大きい有限値が必要です。" },
      { name: "開口高さ", unit: "m", meaning: "上端 − 下端で導出する矩形開口高さです。", effect: "大きいほど開口面積と受照領域が増えます。", note: "Singleでは導出表示、Multiでは高さ入力から上端を導出します。" },
      { name: "腰壁高さ（Multi）", unit: "m", meaning: "各Floor床から開口下端までの高さです。", effect: "大きくすると開口全体と庇・フィンの床基準位置が上がります。", note: "階高内で開口が成立するように設定します。" },
      { name: "階高（Multi）", unit: "m", meaning: "Floorの床から次の床までの高さです。", effect: "変更すると積層図の累積高さが変わります。", note: "上下階相互の物理的な影計算には現在使いません。" },
    ],
  },
  {
    title: "水平庇",
    items: [
      { name: "水平庇 ON / OFF", unit: "—", meaning: "矩形水平庇を計算対象に含める切替です。", effect: "OFFでは庇の直達影と天空日射低減を除きます。", note: "フィンは別のON/OFFを持ちます。" },
      { name: "庇の出", unit: "m", meaning: "壁面y=0から外向きへの庇奥行です。", effect: "一般に大きいほど庇による直達影と近似天空日射低減が増えます。", note: "太陽位置・開口との相対高さにより効果は変わります。" },
      { name: "庇高さ", unit: "m", meaning: "Floor床基準の庇取付高さです。", effect: "開口上端とのoffsetを変え、同じD/Hでも影が変わります。", note: "D/HだけでなくO/H（窓上端offset）にも依存します。" },
      { name: "左側 / 右側延長", unit: "m", meaning: "開口端から庇が左右へ張り出す長さです。", effect: "大きくすると斜め入射時に庇の有限幅影が届く範囲が広がります。", note: "負値は使えません。" },
    ],
  },
  {
    title: "端部縦フィン",
    items: [
      { name: "左フィン / 右フィン", unit: "—", meaning: "開口左右端に置く厚さなしの縦フィンです。", effect: "左右を個別にON/OFFでき、太陽方位に応じて影の側が変わります。", note: "直達日射の影だけを計算します。" },
      { name: "フィンの出", unit: "m", meaning: "壁面から外向きへのフィン奥行です。", effect: "一般に大きいほど側方からの直達影が増えます。", note: "0は有効な影を作らずv1経路を維持します。" },
      { name: "フィン下端 / 上端", unit: "m", meaning: "Floor床基準のフィン鉛直範囲です。", effect: "開口との重なり範囲を広げると影を作れる領域が増えます。", note: "上端は下端より大きい有限値が必要です。厚さはモデル化しません。" },
    ],
  },
  {
    title: "中間縦フィン",
    items: [
      { name: "中間フィン ON / OFF", unit: "—", meaning: "開口内に中央割付する反復縦フィン配列です。", effect: "ONにすると指定pitchまたは枚数から実配置を導出します。", note: "端部フィンとは別物で、開口のstrict interiorに配置します。" },
      { name: "中央割付", unit: "—", meaning: "左右端部余白が等しくなるよう、開口中心に対称配置します。", effect: "幅・pitch・枚数から配置座標が決まります。", note: "導出座標はpresetへ保存せず、読込時に再計算します。" },
      { name: "ピッチ指定", unit: "m", meaning: "隣り合うフィン中心線間の中心ピッチPを指定します。", effect: "Pを小さくすると実配置枚数が増えます。", note: "clear spacingではありません。Pが開口幅より大きい場合は実配置0枚です。" },
      { name: "枚数指定", unit: "枚", meaning: "中央割付する実フィン枚数を整数で指定します。", effect: "枚数を増やすと導出中心ピッチと端部余白が小さくなります。", note: `1〜${GUIDE_MODEL_IDENTITY.maxIntermediateFins}枚。上限超過は切り捨てずエラーです。` },
      { name: "実配置枚数", unit: "枚", meaning: "幅と指定方式から導出された、実際に計算するフィン数です。", effect: "pitch指定ではfloor(width / pitch)で候補数を決めます。", note: `最大${GUIDE_MODEL_IDENTITY.maxIntermediateFins}枚です。` },
      { name: "実中心ピッチ", unit: "m", meaning: "導出された隣接中心線間隔です。", effect: "枚数指定では幅 / (枚数 + 1)になります。", note: "実配置0枚では「—」です。" },
      { name: "左右端部余白", unit: "m", meaning: "開口端から最寄りフィン中心線までの距離です。", effect: "中央割付のため左右は同値です。", note: "フィン面のclear gapではなく中心線までの距離です。" },
      { name: "出 / 下端 / 上端", unit: "m", meaning: "全中間フィンで共有する奥行と鉛直範囲です。", effect: "奥行や開口との鉛直重なりを増やすと直達影が増える傾向です。", note: "厚さなし・直達影のみ。各フィンの個別寸法は設定できません。" },
    ],
  },
  {
    title: "ガラス・地面",
    items: [
      { name: "SHGC（日射熱取得率）", unit: "0〜1", meaning: "窓面へ到達した日射のうち室内へ日射熱として入る割合です。", effect: "大きいほど同じ入射日射に対する日射熱取得量が比例して増えます。", note: "U値や熱貫流、窓枠は含みません。" },
      { name: "地面反射率", unit: "0〜1", meaning: "GHIから地面反射成分を近似する反射率です。", effect: "大きいほど地面反射による窓面日射が増えます。", note: "現モデルでは庇・フィンによる地面反射成分の遮蔽は行いません。" },
    ],
  },
];

const QUICK_STEPS = [
  ["気象データを選ぶ", "「EPWファイルを読み込む」または「デモ比較を試す」"],
  ["比較案を作る", "「案を追加」「複製」、Multiでは「建物案を追加」"],
  ["形状・性能値を入力", "方位、開口、庇、縦フィン、SHGCを編集"],
  ["形状図で確認", "「断面」「立面」、Multiでは「積層形状」を確認"],
  ["比較計算を実行", "「比較計算を実行」または「複数階比較を実行」"],
  ["結果・出力を確認", "期間別・月別・Building Total、CSV / PDFを確認"],
] as const;

const TOC = [
  ["はじめに", "guide-intro"], ["3分で試す", "guide-quick"],
  ["単一階 / 複数階", "guide-modes"], ["パラメータ", "guide-parameters"],
  ["検討例", "guide-examples"], ["パラメトリック探索", "guide-explorer"], ["結果の読み方", "guide-results"],
  ["保存・出力", "guide-exports"], ["技術詳細", "guide-technical"],
  ["適用範囲", "guide-limitations"],
] as const;

function ParameterDiagram() {
  return (
    <div className="guide-diagrams">
      <figure className="guide-diagram">
        <svg viewBox="0 0 620 340" role="img" aria-labelledby="guide-elevation-title guide-elevation-desc">
          <title id="guide-elevation-title">開口と縦フィンの立面模式図</title>
          <desc id="guide-elevation-desc">開口幅、下端、上端、端部フィン、中間フィン、中心ピッチ、端部余白を示します。</desc>
          <rect className="guide-wall-fill" x="44" y="26" width="532" height="278" />
          <rect className="guide-opening-fill" x="126" y="78" width="368" height="170" />
          <line className="guide-fin-left" x1="126" y1="62" x2="126" y2="264" />
          <line className="guide-fin-right" x1="494" y1="62" x2="494" y2="264" />
          {[172, 264, 356, 448].map((x) => <line className="guide-fin-array" x1={x} y1="70" x2={x} y2="256" key={x} />)}
          <g className="guide-dimension">
            <line x1="126" y1="282" x2="494" y2="282" /><line x1="126" y1="274" x2="126" y2="290" /><line x1="494" y1="274" x2="494" y2="290" />
            <text x="310" y="318" textAnchor="middle">開口幅 W</text>
            <line x1="172" y1="52" x2="264" y2="52" /><line x1="172" y1="45" x2="172" y2="59" /><line x1="264" y1="45" x2="264" y2="59" />
            <text x="218" y="39" textAnchor="middle">中心ピッチ P</text>
            <line x1="126" y1="270" x2="172" y2="270" /><line x1="126" y1="264" x2="126" y2="276" /><line x1="172" y1="264" x2="172" y2="276" />
            <text x="149" y="300" textAnchor="middle">端部余白</text>
            <line x1="92" y1="78" x2="92" y2="248" /><line x1="84" y1="78" x2="100" y2="78" /><line x1="84" y1="248" x2="100" y2="248" />
            <text x="82" y="160" textAnchor="middle" transform="rotate(-90 82 160)">開口高さ</text>
          </g>
          <text x="132" y="96">上端</text><text x="132" y="242">下端 / sill</text>
          <text x="104" y="54" textAnchor="end">左端部フィン</text><text x="516" y="54">右端部フィン</text>
          <text x="310" y="112" textAnchor="middle">中間フィン（中央割付）</text>
        </svg>
        <figcaption>パラメータ説明用の模式図 · 立面（CAD寸法図ではありません）</figcaption>
      </figure>
      <figure className="guide-diagram">
        <svg viewBox="0 0 620 340" role="img" aria-labelledby="guide-section-title guide-section-desc">
          <title id="guide-section-title">庇とフィンの断面模式図</title>
          <desc id="guide-section-desc">壁、開口、庇の出と高さ、縦フィンの出を示します。</desc>
          <rect className="guide-wall-fill" x="78" y="30" width="86" height="274" />
          <rect className="guide-opening-fill" x="136" y="110" width="34" height="150" />
          <line className="guide-overhang" x1="164" y1="84" x2="474" y2="84" />
          <polygon className="guide-fin-projection" points="164,120 356,120 356,244 164,244" />
          <line className="guide-dimension" x1="164" y1="54" x2="474" y2="54" /><line className="guide-dimension" x1="164" y1="46" x2="164" y2="62" /><line className="guide-dimension" x1="474" y1="46" x2="474" y2="62" />
          <text x="319" y="42" textAnchor="middle">庇の出 D</text>
          <line className="guide-dimension" x1="188" y1="120" x2="356" y2="120" /><line className="guide-dimension" x1="188" y1="112" x2="188" y2="128" /><line className="guide-dimension" x1="356" y1="112" x2="356" y2="128" />
          <text x="272" y="148" textAnchor="middle">フィンの出</text>
          <line className="guide-dimension" x1="520" y1="84" x2="520" y2="304" /><line className="guide-dimension" x1="512" y1="84" x2="528" y2="84" /><line className="guide-dimension" x1="512" y1="304" x2="528" y2="304" />
          <text x="542" y="194" textAnchor="middle" transform="rotate(-90 542 194)">庇高さ（床基準）</text>
          <line className="guide-floor" x1="42" y1="304" x2="548" y2="304" />
          <text x="50" y="326">Floor床 z=0</text><text x="104" y="98">壁 / 開口</text>
        </svg>
        <figcaption>パラメータ説明用の模式図 · 断面（CAD寸法図ではありません）</figcaption>
      </figure>
    </div>
  );
}

function ModeButton({ mode, children, onNavigate }: { readonly mode: Exclude<WorkspaceMode, "guide">; readonly children: string; readonly onNavigate: (mode: WorkspaceMode) => void }) {
  return <button type="button" className="guide-mode-button" onClick={() => onNavigate(mode)}>{children}</button>;
}

export function UserGuide({ onNavigate }: { readonly onNavigate: (mode: WorkspaceMode) => void }) {
  const summer = `${GUIDE_MODEL_IDENTITY.summerMonths[0]}〜${GUIDE_MODEL_IDENTITY.summerMonths.at(-1)}月`;
  const winter = `${GUIDE_MODEL_IDENTITY.winterMonths[0]}〜${GUIDE_MODEL_IDENTITY.winterMonths.at(-1)}月`;
  return (
    <main className="guide-page" id="guide" data-guide-version="m8">
      <header className="guide-hero" id="guide-intro">
        <div>
          <p className="section-kicker">M8 · USER GUIDE &amp; TECHNICAL MANUAL</p>
          <h1><span>Facade Solar Lab</span>使い方・技術情報</h1>
          <p className="guide-lede">ファサードの日射熱取得を、方位・開口・庇・縦フィン・ガラス条件を変えながら比較する設計支援ツール</p>
        </div>
        <div className="guide-hero-actions no-print">
          <ModeButton mode="single" onNavigate={onNavigate}>単一階へ</ModeButton>
          <ModeButton mode="multi" onNavigate={onNavigate}>複数階へ</ModeButton>
          <button type="button" className="guide-print-button" onClick={() => window.print()}>このマニュアルを印刷 / PDF保存</button>
        </div>
      </header>

      <aside className="guide-scope-note" aria-label="このツールの位置づけ">
        <strong>相対的な設計比較のためのモデルです。</strong>
        <span>表示する絶対値[kWh]はHVAC負荷・BEI・性能保証値ではなく、正式な物理validationは未完了です。</span>
      </aside>

      <div className="guide-layout">
        <nav className="guide-toc no-print" aria-label="使い方・技術情報の目次">
          <strong>目次</strong>
          {TOC.map(([label, id]) => <a href={`#${id}`} key={id}>{label}</a>)}
        </nav>

        <div className="guide-content">
          <section className="guide-section" id="guide-quick" aria-labelledby="guide-quick-title">
            <div className="guide-heading"><p>BEGINNER GUIDE</p><h2 id="guide-quick-title">3分で試す</h2></div>
            <div className="quick-steps">
              {QUICK_STEPS.map(([title, description], index) => (
                <article key={title}><span>{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div></article>
              ))}
            </div>
            <div className="guide-demo-note">
              <strong>EPWがなくてもデモで操作確認できます。</strong>
              <p>「デモ比較を試す」またはフィンpitch比較を選べます。ただしsynthetic demoは実測気象ではなく、性能検証用データでもありません。</p>
            </div>
          </section>

          <section className="guide-section" id="guide-modes" aria-labelledby="guide-modes-title">
            <div className="guide-heading"><p>CHOOSE A WORKSPACE</p><h2 id="guide-modes-title">単一階と複数階の使い分け</h2></div>
            <div className="mode-guide-grid">
              <article>
                <span>Single</span><h3>単一階モード</h3>
                <p>1つのファサード断面・開口条件について最大4案を比較します。</p>
                <ul><li>庇出・開口寸法・SHGC・方位</li><li>左右端部フィン</li><li>中間フィンpitch / 枚数</li></ul>
                <ModeButton mode="single" onNavigate={onNavigate}>単一階で始める</ModeButton>
              </article>
              <article>
                <span>Multi</span><h3>複数階モード</h3>
                <p>各Floorをcanonical facade engineで個別計算し、Building Totalへ単純合算します。</p>
                <ul><li>階ごとに異なる庇・フィンpitch</li><li>Building Total比較</li><li>Floor Breakdown</li></ul>
                <p className="guide-inline-warning">cross-floor physical shadingは未実装です。</p>
                <ModeButton mode="multi" onNavigate={onNavigate}>複数階で始める</ModeButton>
              </article>
            </div>
            <div className="mode-flow" aria-label="SingleとMultiの構造差">
              <span>Single: 1 facade input</span><b>→</b><span>simulateFacade()</span><b>→</b><span>1 case result</span>
              <span>Multi: Floor 1…n</span><b>→</b><span>各FloorでsimulateFacade()</span><b>→</b><span>Σ Building Total</span>
            </div>
          </section>

          <section className="guide-section" id="guide-parameters" aria-labelledby="guide-parameters-title">
            <div className="guide-heading"><p>PARAMETER REFERENCE</p><h2 id="guide-parameters-title">入力パラメータ辞典</h2></div>
            <ParameterDiagram />
            <aside className="pitch-example" aria-labelledby="pitch-example-title">
              <div><p>中間フィン · pitch例</p><h3 id="pitch-example-title">開口幅6m / 中心ピッチ1.5m</h3></div>
              <p><strong>実配置4枚</strong><br />左端から <code>0.75 / 2.25 / 3.75 / 5.25 m</code><br />左右端部余白 <code>0.75 m</code></p>
              <p>pitchはフィン中心線間の距離です。clear spacingではありません。</p>
            </aside>
            <div className="parameter-groups">
              {PARAMETER_GROUPS.map((group) => (
                <section className="parameter-group" aria-labelledby={`parameter-${group.title}`} key={group.title}>
                  <h3 id={`parameter-${group.title}`}>{group.title}</h3>
                  <div className="parameter-card-grid">
                    {group.items.map((item) => (
                      <article className="parameter-card" key={item.name}>
                        <header><strong>{item.name}</strong><span>{item.unit}</span></header>
                        <dl><div><dt>意味</dt><dd>{item.meaning}</dd></div><div><dt>変えると</dt><dd>{item.effect}</dd></div><div><dt>注意</dt><dd>{item.note}</dd></div></dl>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="guide-section" id="guide-examples" aria-labelledby="guide-examples-title">
            <div className="guide-heading"><p>HOW TO RUN A STUDY</p><h2 id="guide-examples-title">設計検討の組み立て方</h2></div>
            <div className="study-grid">
              <article><span>01</span><h3>水平庇</h3><p>Baseline <code>D=0.8m</code> / Alternative <code>D=1.6m</code></p><p>Annual、Summer、Winter、monthlyを同じ気象・開口・SHGCで比較します。</p></article>
              <article><span>02</span><h3>中間フィン</h3><p>A: なし / B: <code>D0.6・P2.0</code> / C: <code>D0.6・P1.0</code></p><p>夏期・冬期・月別と基準案差を確認します。数値だけで自動的な優劣は決めません。</p></article>
              <article><span>03</span><h3>Multi-floor</h3><p>1F <code>P2.0</code> / 2F <code>P1.5</code> / 3F <code>P1.0</code></p><p>Building TotalとFloor Breakdownを併読し、全体差と階別寄与を分けて見ます。</p></article>
            </div>
          </section>

          <section className="guide-section" id="guide-explorer" aria-labelledby="guide-explorer-title">
            <div className="guide-heading"><p>PARAMETRIC DESIGN EXPLORER</p><h2 id="guide-explorer-title">少しずつ条件を変えて、傾向を見る</h2></div>
            <p>Singleの選択中の案を基準にする、独立した探索結果です。通常の比較案を一括変更せず、候補を選んでから追加できます。Multi探索は対象外です。</p>
            <ol>
              <li>単一階モードでEPWまたはデモ気象を用意し、元にする案を選びます。</li>
              <li>「パラメトリック探索」→「探索を設定する」を開きます。</li>
              <li>Axis Aのパラメータ・最小・最大・刻みを設定します。庇やフィンは元の案で先に有効にします。</li>
              <li>必要なら2Dを有効にし、別のAxis Bを指定します。総候補数は最大{MAX_STUDY_CANDIDATES}です。</li>
              <li>「探索を実行」。進捗を確認し、必要ならキャンセルします。未完了結果は採用しません。</li>
              <li>1Dグラフ、2D Heatmap・Trade-offと正確な数値表から候補を選び、完全入力・形状・実フィン枚数を確認します。</li>
              <li>「比較案に追加」で通常のSingleへ追加し、比較計算を明示実行します。探索CSV・印刷/PDFも利用できます。</li>
            </ol>
            <p>Heatmapの色は選択指標の大小だけです。Trade-offは横軸が夏期差、縦軸が冬期差、十字が元の案（0 / 0）。差分 = 候補 − 元の案。小さい値を自動的に「良い」「最適」とは判定しません。</p>
            <p>元の案・気象・範囲が変わるとSTALEになります。前回snapshotを残しますが、再実行まで比較案追加・結果出力を禁止します。partialは読込期間のみ、syntheticは操作デモであり性能証拠ではありません。</p>
            <details><summary>探索の技術契約</summary>
              <p>{CANDIDATE_GENERATION_VERSION}: 小数6桁以内の整数スケール格子 min + index × step ≤ max。浮動小数の繰返し加算をせず、格子にないmaxを追加しません。同一軸の重複・不正な範囲・上限超過は拒否し、候補の形状不成立はINVALIDとして理由を残します。</p>
              <p>基準案は探索範囲外でも維持。候補の直接影・太陽位置・気象・SHGC・集計は既存のcanonical engineをそのまま呼びます。Web Workerで実行し、キャンセル時はterminate、古いrunの応答は破棄します。元の案・気象と結果snapshotは分離します。</p>
              <p>CSVは全候補・入力・実配置・model identity・気象出典・実行日時を記録。JSONは入力専用で、結果・EPW・local path・認証情報を含みません。読み込み時は選択中の案の入力置換を確認し、再計算が必要です。</p>
              <p>物理モデルや精度の拡張ではありません。fin diffuse / cross-floor shadow未実装、M5外部参照NOT_RUN、正式な絶対kWh物理validation未完了を維持します。</p>
            </details>
          </section>

          <section className="guide-section" id="guide-results" aria-labelledby="guide-results-title">
            <div className="guide-heading"><p>RESULTS GUIDE</p><h2 id="guide-results-title">結果の読み方</h2></div>
            <div className="result-guide-grid">
              <article><h3>期間</h3><dl><div><dt>Annual</dt><dd>1〜12月</dd></div><div><dt>Summer</dt><dd>{summer}</dd></div><div><dt>Winter</dt><dd>{winter}</dd></div><div><dt>Monthly</dt><dd>各月の推移</dd></div></dl></article>
              <article><h3>比較</h3><dl><div><dt>Baseline</dt><dd>差分の基準案</dd></div><div><dt>delta [kWh]</dt><dd>各案 − 基準案</dd></div><div><dt>delta [%]</dt><dd>基準案に対する相対差</dd></div></dl></article>
              <article><h3>「庇あり」列</h3><p>歴史的な列名です。M7では<strong>庇 + 有効な端部・中間フィンによる複合遮蔽後</strong>の日射熱取得量を表します。</p></article>
              <article><h3>「庇なし」列</h3><p>庇・フィンなどの遮蔽物がないreferenceです。形状差の比較基準に使います。</p></article>
              <article><h3>Multi</h3><p><strong>Building Total</strong>は各Floor結果のsimple sum、<strong>Floor Breakdown</strong>は各Floorのindividual canonical resultです。</p></article>
              <article className="result-caution"><h3>負のdelta</h3><p>基準案より日射熱取得が小さいことを示すだけで、自動的に「良い案」を意味しません。夏の日射低減と冬の日射取得には異なる設計上の意味があります。</p></article>
            </div>
            <p className="guide-hvac-note">表示値は開口を通る日射熱取得量であり、HVAC cooling/heating loadではありません。</p>
          </section>

          <section className="guide-section" id="guide-exports" aria-labelledby="guide-exports-title">
            <div className="guide-heading"><p>EXPORT &amp; PRESETS</p><h2 id="guide-exports-title">保存・出力</h2></div>
            <div className="export-guide-grid">
              <article><h3>CSV</h3><p>Single / Multiのcurrent calculated snapshotをExcel等で比較分析できます。入力がstaleの間はexportできません。</p></article>
              <article><h3>PDF / Print</h3><p>browser printからPDF保存できます。入力条件、比較、geometry、model notesを出力します。再計算後のsnapshotを使ってください。</p></article>
              <article><h3>JSON preset</h3><p>Case / Workspace、Multi case / workspaceの<strong>input-only</strong>保存です。結果、raw weather、EPW bytes、local pathは保存しません。</p><p><strong>JSON読込後は再計算が必要です。</strong></p></article>
            </div>
          </section>

          <section className="guide-section technical-section" id="guide-technical" aria-labelledby="guide-technical-title">
            <div className="guide-heading"><p>TECHNICAL MANUAL</p><h2 id="guide-technical-title">技術詳細</h2></div>
            <p className="technical-intro">ここからは計算経路・モデルidentity・近似の境界を確認するための詳細です。初回操作では展開しなくても使えます。</p>
            <div className="calculation-pipeline" aria-label="計算パイプライン">
              {['EPW','solar position','facade irradiance','direct shading','SHGC × opening area','interval solar heat gain','monthly / annual aggregation','comparison'].map((step, index) => <span key={step}>{step}{index < 7 ? <b aria-hidden="true">↓</b> : null}</span>)}
            </div>
            <div className="technical-details">
              <details><summary>Solar position</summary><div><h3>太陽位置</h3><p>Local Standard Timeを基準に <code>{GUIDE_MODEL_IDENTITY.solarPosition}</code> で区間中点の太陽高度・方位を計算します。DST、host timezone、JavaScript Dateには依存しません。</p></div></details>
              <details><summary>Direct shading v1</summary><div><h3>水平庇の有限幅直達影</h3><p><code>{GUIDE_MODEL_IDENTITY.directV1}</code></p><p>有限矩形庇を投影してshadow polygonを作り、矩形開口でclipします。D/Hと窓上端offsetの双方を扱います。</p></div></details>
              <details><summary>Direct shading v2</summary><div><h3>庇 + 縦フィン配列</h3><p><code>{GUIDE_MODEL_IDENTITY.directV2}</code></p><p>水平庇、左右jamb fins、反復intermediate finsのclipped convex shadow polygonをunionします。多数フィンはanalytic x-sweep / slab integrationで処理し、samplingやraster推定は使いません。</p></div></details>
              <details><summary>Diffuse / Ground reflection</summary><div><h3>近似成分</h3><p>Diffuse: <code>{GUIDE_MODEL_IDENTITY.diffuse}</code>。庇のみのisotropic 2D infinite-width近似で、vertical finによるdiffuse reductionは計算しません。</p><p>Ground: <code>{GUIDE_MODEL_IDENTITY.ground}</code>。現モデルでは遮蔽物によるground-reflected componentの遮蔽は行いません。</p></div></details>
              <details><summary>Solar gain formula</summary><div><h3>日射熱取得</h3><p className="guide-formula"><span>Solar Gain [kWh]</span><b>=</b><span>Facade Irradiance [Wh/m²]</span><b>×</b><span>Opening Area [m²]</span><b>×</b><span>SHGC</span><b>÷ 1000</b></p><p>intervalごとに計算し、monthly・annual・seasonalへ決定論的に集計します。</p></div></details>
              <details><summary>Multi-floor composition</summary><div><h3>各Floorの合成</h3><p>Each Floor: <code>simulateFacade()</code></p><p>Building Total: <code>Σ Floor result</code></p><p>solar / weather / SHGC / aggregationを共有しますが、cross-floor physical shadowは計算しません。</p></div></details>
            </div>
          </section>

          <section className="guide-section" id="guide-limitations" aria-labelledby="guide-limitations-title">
            <div className="guide-heading"><p>MODEL LIMITATIONS</p><h2 id="guide-limitations-title">適用範囲</h2></div>
            <div className="scope-grid">
              <article className="scope-supported"><h3>できること</h3><ul><li>relative design comparison</li><li>facade orientation / opening geometry</li><li>finite overhang direct shadow</li><li>jamb fins direct shadow</li><li>intermediate fin arrays direct shadow</li><li>SHGC / ground reflectance</li><li>EPW / synthetic demo</li><li>Single / Multi</li><li>Annual / Summer / Winter / monthly</li><li>CSV / PDF / input presets</li></ul></article>
              <article className="scope-unsupported"><h3>対象外・未検証</h3><ul><li>HVAC cooling/heating load</li><li>BEI / equipment sizing</li><li>energy consumption prediction</li><li>legal compliance certification</li><li>formal absolute-kWh validation</li><li>fin diffuse shading</li><li>cross-floor physical shading</li><li>reveal / fin thickness</li><li>arbitrary facade mesh</li><li>multiple independent openings per Floor</li><li>Radiance / EnergyPlus / SPA external validation</li></ul></article>
            </div>
            <aside className="validation-status"><strong>M5: LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING</strong><span>Radiance / EnergyPlus / SPA: NOT_RUN</span></aside>
          </section>

          <nav className="guide-bottom-nav no-print" aria-label="ワークスペースへ移動">
            <ModeButton mode="single" onNavigate={onNavigate}>単一階へ</ModeButton>
            <a href="#guide">ページ上部へ</a>
            <ModeButton mode="multi" onNavigate={onNavigate}>複数階へ</ModeButton>
          </nav>
        </div>
      </div>
    </main>
  );
}
