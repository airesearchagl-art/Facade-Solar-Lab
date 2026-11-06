// The first line is a display convention inside the existing v1 description.
function category(id: string, name: string, layers: string, unspecified: string) {
  return { id, name, layers, unspecified, kind: 'GENERIC_CONSTRUCTION' as const, performance: 'UNKNOWN' as const };
}

const custom = category('custom', '未選択・カスタム', '層構成は自由記述です。', '層数、厚さ、中空層、膜面、製品');
export const constructions = [
  custom,
  category('single', '単板ガラス', 'ガラス板1枚。', '板厚、ガラス種、表面処理、製品'),
  category('double', '一般的な複層ガラス', '2枚のガラスの間に中空層があります。', '各板厚、中空層厚、封入気体、膜の有無・位置、製品'),
  category('low-e-gain', 'Low-E複層ガラス（日射取得型）', '中空層を挟む2枚のガラスとLow-E膜を用いる日射取得型の分類です。', '各板厚、中空層厚、封入気体、膜面・膜仕様、製品'),
  category('low-e-shield', 'Low-E複層ガラス（日射遮蔽型）', '中空層を挟む2枚のガラスとLow-E膜を用いる日射遮蔽型の分類です。', '各板厚、中空層厚、封入気体、膜面・膜仕様、製品'),
  category('triple', '三層ガラス', '3枚のガラスの間に2つの中空層があります。', '各板厚、中空層厚、各層の封入気体、膜の有無・位置、製品'),
] as const;

const heading = (name: string) => '【一般構成】' + name;

export function constructionDescription(description: string | null) {
  const text = description ?? '';
  const newline = text.indexOf('\n');
  const firstLine = newline < 0 ? text : text.slice(0, newline);
  const selected = constructions.find(c => c !== custom && heading(c.name) === firstLine);
  return selected
    ? { selected, notes: newline < 0 ? '' : text.slice(newline + 1) }
    : { selected: custom, notes: text };
}

export function describeConstruction(selected: typeof custom, notes: string): string {
  if (selected.id === custom.id) return notes;
  return heading(selected.name) + (notes ? '\n' + notes : '');
}
