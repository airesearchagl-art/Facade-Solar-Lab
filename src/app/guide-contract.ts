import {
  DEFAULT_FACADE_V1_PERIODS,
  FACADE_V1_DIFFUSE_SHADING_MODEL,
  FACADE_V1_DIRECT_SHADING_MODEL,
  FACADE_V1_GROUND_REFLECTION_MODEL,
  type SolarPosition,
} from "../engine";
import { FACADE_V2_DIRECT_SHADING_MODEL } from "../engine/facade-v2";
import { MAX_INTERMEDIATE_FINS } from "../geometry/facade-v2";

/** Runtime identity shown by the manual. Tests compare this object to engine exports. */
export const GUIDE_MODEL_IDENTITY = Object.freeze({
  solarPosition: "noaa-fractional-year-v1" satisfies SolarPosition["algorithm"],
  directV1: FACADE_V1_DIRECT_SHADING_MODEL,
  directV2: FACADE_V2_DIRECT_SHADING_MODEL,
  diffuse: FACADE_V1_DIFFUSE_SHADING_MODEL,
  ground: FACADE_V1_GROUND_REFLECTION_MODEL,
  maxIntermediateFins: MAX_INTERMEDIATE_FINS,
  summerMonths: DEFAULT_FACADE_V1_PERIODS.coolingMonths,
  winterMonths: DEFAULT_FACADE_V1_PERIODS.heatingMonths,
});
