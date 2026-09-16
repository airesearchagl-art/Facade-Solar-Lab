import { Children, isValidElement, type ChangeEvent, type ReactElement, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AxisEditor } from "../src/app/components/ParametricExplorer";
import { createDemoComparisonWorkspace } from "../src/demo/demo-scenario";
import { AXES, axisValues, candidateCount, recommendedSecondaryAxis, recommendedSweepAxis } from "../src/explorer/sweep";
import type { AxisKey, SweepAxis } from "../src/explorer/types";

const source = createDemoComparisonWorkspace().cases[0]!;
const withOpening = (widthM: number, sillZM: number, headZM: number) => ({ ...source, parameters: { ...source.parameters, opening: { ...source.parameters.opening, widthM, sillZM, headZM } } });
// Inspect/invoke native element handlers without adding a DOM or test-renderer dependency.
function elements(node: ReactNode): ReactElement<{ children?: ReactNode }>[] {
  return Children.toArray(node).flatMap(child => isValidElement<{ children?: ReactNode }>(child) ? [child, ...elements(child.props.children)] : []);
}
function native<P>(node: ReactNode, type: string): ReactElement<P>[] {
  return elements(node).filter(child => child.type === type) as ReactElement<P>[];
}

describe("RF-M9-UX-01 canonical starter presets", () => {
  it.each(AXES)("provides a deterministic six-decimal, <=8 recommendation for $key", ({ key }) => {
    const before = JSON.stringify(source);
    const axis = recommendedSweepAxis(source, key);
    const values = axisValues(axis); // Uses the existing strict lattice validator.
    expect(axis).toEqual(recommendedSweepAxis(source, key));
    expect(values.length).toBeGreaterThan(0);
    expect(values.length).toBeLessThanOrEqual(8);
    expect(JSON.stringify(source)).toBe(before);
    for (const other of AXES.filter(item => item.key !== key)) {
      expect(candidateCount({ a: axis, b: recommendedSweepAxis(source, other.key) })).toBeLessThanOrEqual(64);
    }
  });
  it("fixes all non-geometric ranges and units independently of the implementation", () => {
    const expected: readonly [AxisKey, number, number, number, string][] = [
      ["facadeAzimuthDegFromNorth", 0, 315, 45, "°"],
      ["solarHeatGainCoefficient", .2, .8, .1, "-"], ["groundReflectance", 0, .6, .1, "-"],
      ["overhang.depthM", .8, 2, .2, "m"],
      ["overhang.leftExtensionM", 0, 1.5, .25, "m"], ["overhang.rightExtensionM", 0, 1.5, .25, "m"],
      ["leftFin.depthM", 0, 1.2, .2, "m"], ["rightFin.depthM", 0, 1.2, .2, "m"], ["intermediateFins.depthM", 0, 1.2, .2, "m"],
      ["intermediateFins.layout.pitchM", .5, 3, .5, "m"], ["intermediateFins.layout.count", 1, 8, 1, "枚"],
    ];
    expect(AXES).toHaveLength(15);
    for (const [key, min, max, step, unit] of expected) {
      expect(recommendedSweepAxis(source, key)).toEqual({ key, min, max, step });
      expect(AXES.find(item => item.key === key)?.unit).toBe(unit);
    }
    expect(axisValues(recommendedSweepAxis(source, "facadeAzimuthDegFromNorth"))).toEqual([0, 45, 90, 135, 180, 225, 270, 315]);
    expect(axisValues(recommendedSweepAxis(source, "intermediateFins.layout.count"))).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it.each([[4, 1, 3], [.1, -.3, -.2], [.00000001, 1.2345678, 1.2345681], [3.123456789, -2.123456789, .123456789]])("keeps geometry recommendations within the intended source boundaries (%s,%s,%s)", (width, sill, head) => {
    const example = withOpening(width, sill, head);
    for (const key of ["opening.widthM", "opening.sillZM", "opening.headZM", "overhang.elevationZM"] as const) {
      const axis = recommendedSweepAxis(example, key), values = axisValues(axis);
      expect(values.length).toBeGreaterThan(0); expect(values.length).toBeLessThanOrEqual(7);
      for (const value of values) {
        if (key === "opening.widthM") expect(value).toBeGreaterThan(0);
        if (key === "opening.sillZM") expect(value).toBeLessThan(head);
        if (key === "opening.headZM") expect(value).toBeGreaterThan(sill);
        if (key === "overhang.elevationZM") expect(value).toBeGreaterThanOrEqual(head);
      }
    }
  });
  it("uses +/-0.6m around practical dimensions and head..head+0.6 for elevation", () => {
    const example = withOpening(4, 1, 3);
    expect(recommendedSweepAxis(example, "opening.widthM")).toMatchObject({ min: 3.4, max: 4.6, step: .2 });
    expect(recommendedSweepAxis(example, "opening.sillZM")).toMatchObject({ min: .4, max: 1.6, step: .2 });
    expect(recommendedSweepAxis(example, "opening.headZM")).toMatchObject({ min: 2.4, max: 3.6, step: .2 });
    expect(recommendedSweepAxis(example, "overhang.elevationZM")).toMatchObject({ min: 3, max: 3.6, step: .1 });
  });
  it("leaves unrepresentable source geometry visibly invalid instead of inventing a valid source", () => {
    for (const value of [NaN, Infinity, 1e30]) {
      const axis = recommendedSweepAxis(withOpening(value, 1, 3), "opening.widthM");
      expect(() => axisValues(axis)).toThrow();
      expect(() => renderToStaticMarkup(<AxisEditor source={source} axis={axis} name="A" onChange={() => {}} />)).not.toThrow();
    }
  });
  it("selects a distinct recommended B, including A=SHGC", () => {
    for (const { key } of AXES) {
      const b = recommendedSecondaryAxis(source, key);
      expect(b.key).toBe(key === "solarHeatGainCoefficient" ? "facadeAzimuthDegFromNorth" : "solarHeatGainCoefficient");
      expect(b).toEqual(recommendedSweepAxis(source, b.key));
      expect(candidateCount({ a: recommendedSweepAxis(source, key), b })).toBeLessThanOrEqual(64);
    }
  });
});

describe("RF-M9-UX-01 shared A/B editor", () => {
  it.each(["A", "B"])("replaces the complete %s axis on parameter change, updates units/count, and resets", name => {
    let axis: SweepAxis = { key: "overhang.depthM", min: 9, max: 10, step: 1 };
    const onChange = vi.fn((next: SweepAxis) => { axis = next; });
    const view = () => AxisEditor({ source, axis, name, onChange });
    for (const [key, unit, count] of [["facadeAzimuthDegFromNorth", "°", 8], ["solarHeatGainCoefficient", "-", 7], ["intermediateFins.layout.pitchM", "m", 6], ["intermediateFins.layout.count", "枚", 8], ["overhang.depthM", "m", 7]] as const) {
      native<SelectHTMLAttributes<HTMLSelectElement>>(view(), "select")[0]!.props.onChange!({ target: { value: key } } as ChangeEvent<HTMLSelectElement>);
      expect(axis).toEqual(recommendedSweepAxis(source, key));
      expect(candidateCount({ a: axis })).toBe(count);
      const html = renderToStaticMarkup(view());
      for (const label of ["最小", "最大", "刻み"]) expect(html).toContain(`${label} ${name} [${unit}]`);
    }
    native<InputHTMLAttributes<HTMLInputElement>>(view(), "input")[0]!.props.onChange!({ target: { valueAsNumber: 1.3 } } as ChangeEvent<HTMLInputElement>);
    expect(axis).toEqual({ key: "overhang.depthM", min: 1.3, max: 2, step: .2 });
    expect(candidateCount({ a: axis })).toBe(4);
    native<ButtonHTMLAttributes<HTMLButtonElement>>(view(), "button")[0]!.props.onClick!({} as never);
    expect(axis).toEqual({ key: "overhang.depthM", min: .8, max: 2, step: .2 });
    expect(candidateCount({ a: axis })).toBe(7);
  });
  it.each(["A", "B"])("disables the other selected key in %s, retaining pure duplicate rejection", name => {
    const axis = recommendedSweepAxis(source, "overhang.depthM");
    const tree = AxisEditor({ source, axis, name, otherKey: "solarHeatGainCoefficient", onChange: () => {} });
    const options = native<{ value: AxisKey; disabled: boolean }>(tree, "option");
    expect(options.filter(item => item.props.disabled).map(item => item.props.value)).toEqual(["solarHeatGainCoefficient"]);
    expect(() => candidateCount({ a: axis, b: axis })).toThrow(/同じ/);
  });
  it("preserves manual ranges on source/rerender and unrelated edits, and resets against the latest source", () => {
    let axis: SweepAxis = { key: "opening.widthM", min: 2.1, max: 4.2, step: .3 };
    const b = recommendedSecondaryAxis(source, axis.key), beforeB = { ...b };
    const onChange = vi.fn((next: SweepAxis) => { axis = next; });
    const changedSource = withOpening(6, 1, 3);
    const view = () => AxisEditor({ source: changedSource, axis, name: "A", otherKey: b.key, onChange });
    expect(native<InputHTMLAttributes<HTMLInputElement>>(view(), "input").map(item => item.props.value)).toEqual([2.1, 4.2, .3]);
    expect(onChange).not.toHaveBeenCalled();
    native<InputHTMLAttributes<HTMLInputElement>>(view(), "input")[1]!.props.onChange!({ target: { valueAsNumber: 4.5 } } as ChangeEvent<HTMLInputElement>);
    expect(axis).toEqual({ key: "opening.widthM", min: 2.1, max: 4.5, step: .3 });
    expect(b).toEqual(beforeB);
    native<ButtonHTMLAttributes<HTMLButtonElement>>(view(), "button")[0]!.props.onClick!({} as never);
    expect(axis).toEqual({ key: "opening.widthM", min: 5.4, max: 6.6, step: .2 });
  });
});
