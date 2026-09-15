import { comparisonInputDifferences, formatInputValue } from "../../comparison";
import { floorToFacadeV1Parameters, type MultiFloorCase } from "../../multifloor";

export function FloorInputDifferences({ selected, baseline, floorId }: { readonly selected: MultiFloorCase; readonly baseline: MultiFloorCase; readonly floorId: string }) {
  const index = selected.floors.findIndex((floor) => floor.id === floorId);
  const floor = selected.floors[index];
  const reference = baseline.floors[index];
  if (floor === undefined || reference === undefined) return <p>基準案に同じ階順の入力がありません。</p>;
  const differences = comparisonInputDifferences(
    { id: baseline.id, name: baseline.name, parameters: floorToFacadeV1Parameters(baseline, reference) },
    { id: selected.id, name: selected.name, parameters: floorToFacadeV1Parameters(selected, floor) },
  );
  return <div className="difference-panel"><h3>{baseline.name}・下から{index + 1}番目の階との入力差</h3>{differences.length === 0 ? <p>入力差はありません。</p> : <dl>{differences.map((difference) => <div key={difference.key}><dt>{difference.label}</dt><dd><span>{formatInputValue(difference.baselineValue, difference.unit)}</span><b aria-hidden="true">→</b><strong>{formatInputValue(difference.caseValue, difference.unit)}</strong></dd></div>)}</dl>}</div>;
}
