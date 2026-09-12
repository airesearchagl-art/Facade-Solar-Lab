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
