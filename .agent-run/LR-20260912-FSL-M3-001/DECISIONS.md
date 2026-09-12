# Decisions

Binding: `LRP-20260912-FSL-M3-001` rev `1` / `AFF8B77962787C01B61FE059353FE33B7B3FC9971A1BD126313A1547660DDACB`

| ID | Decision | Reason | Consequence |
| --- | --- | --- | --- |
| M3-D-001 | Branch from exact canonical base and never mutate local `main` | Hard Gate | All M3 work stays on `feat/m3-facade-geometry` |
| M3-D-002 | Normalize only the personal root token and LF in the Task Packet snapshot | Public repository boundary | Snapshot remains semantically exact and reproducibly bound without a user path |
| M3-D-003 | Add `src/geometry/facade-v1` and `src/engine/facade-v1` without editing M2 source | M1/M2 are immutable regression baselines | Geometry, weather, solar, simulation, and UI responsibilities remain separated |
| M3-D-004 | Use metres, wall `y=0`, front-view `+x` right, outward `+y`, up `+z`, north-zero clockwise azimuth | Task Packet coordinate contract | Sun-vector signs and rotation tests derive from one convention |
| M3-D-005 | Use exact convex polygon clipping for direct shade and keep diffuse identity explicit | M3 scope | No raster approximation or false finite-width diffuse claim |
