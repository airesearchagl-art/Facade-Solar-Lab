# Decisions

Binding: `LRP-20260913-FSL-M4-001` rev `1` / `5A3288DF4A540EB7E40AF42E7D5D84505B6B06F61698C06F9D043A38DD4003E8`

| ID | Decision | Reason | Consequence |
| --- | --- | --- | --- |
| M4-D-001 | Branch only from exact canonical main, never from the Vercel smoke ref | Task Packet hard boundary | All M4 code and history remain isolated on `feat/m4-comparison-ux` |
| M4-D-002 | Preserve the Human attachment byte-for-byte as the immutable snapshot | Canonical Long-Run binding | Resume requires exact digest match |
| M4-D-003 | Keep the first commit initialization-only | Git-triggered deployment must be classified before product implementation | Any Production boundary violation stops the run before further commits |
| M4-D-004 | Keep Comparison logic in a browser-independent Pure TypeScript boundary | React is presentation; existing engines remain calculation authorities | UI code cannot duplicate solar/geometry calculations |
| M4-D-005 | Parse an EPW once in the browser adapter and never persist or transmit raw contents | Privacy and performance boundary | No backend, localStorage, bundled real dataset, or duplicate parser |
| M4-D-006 | Require an explicit Run Comparison action for full-year simulations | Four annual cases are too heavy for per-keystroke execution | Edits set dirty state; results retain the last-run snapshot |
| M4-D-007 | Pair the monthly SVG with an exact semantic table and encode series by line style plus Case letter | Color alone is insufficient and charts are approximate views | Monthly values remain keyboard/screen-reader accessible |
| M4-D-008 | Preserve native file-selection verification as explicit unverified evidence when the automation surface cannot attach a host file | Unit/local-real-data evidence cannot truthfully substitute for the OS file dialog interaction | Final state may be `COMPLETE_PENDING_FULL_VERIFY`; no fabricated browser PASS |
| M4-D-009 | Use the final Git-triggered Preview and do not create the authorized manual fallback | Git Integration produced an exact-source READY Preview | No extra manual deployment or target-classification risk was introduced |
| M4-D-010 | Add a deterministic synthetic-weather Demo as a one-click product entry while retaining real EPW as the validation path | The complete comparison value must be visible without an OS file chooser, but synthetic data cannot close RF-01 | Demo results use canonical `facade-v1-weather`, carry explicit non-measured/non-validation disclosure, and never replace Human EPW acceptance |
| M4-D-011 | Derive representative 6/21 and 12/21 section rays from the existing NOAA solar position and facade-local vector | A fixed 12:00 clock time or raw solar elevation would misrepresent solar noon and non-south facades | Pure TypeScript scans Local Standard Time in five-minute steps, uses `atan2(z, y)`, and suppresses incident rays when `y <= 0` |
| M4-D-012 | Use browser print for PDF and a Pure TypeScript wide-format CSV generator | A heavy PDF dependency is unnecessary for the bounded MVP, while editable data must remain portable | A4 print CSS reports the current result; CSV uses UTF-8 BOM, CRLF, quoting, formula-injection protection, and is disabled with dirty results |
| M4-D-013 | Print section/elevation/reference geometry for every result Case while keeping the screen preview selected-Case-only | A selected-only PDF was insufficient for side-by-side design review | A4 uses 1/2/3/2×2 Case grids in result-table order, retains baseline identity, and avoids splitting a Case card |
| M4-D-014 | Store reusable conditions as schemaVersion 1 Pure TypeScript JSON presets with separate Case and Workspace kinds | Named input reuse must not persist or imply result/weather evidence | Parser whitelists fields, validates 256 KB/1–4 cases/IDs/names/numerics, imports a Case under a new ID or confirms Workspace replacement, then clears results pending explicit Run |
