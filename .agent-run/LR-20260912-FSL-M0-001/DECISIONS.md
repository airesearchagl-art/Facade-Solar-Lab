# Decisions

Binding: `LRP-20260912-FSL-M0-001` rev `1` / `DE774A106D9A425E09E8547BF2FAF0DBDD00F2DE55FDFB0CC16BB5ABE1AC2253`

| ID | Decision | Reason | Consequence |
| --- | --- | --- | --- |
| D-001 | Accept remote `main` at `a4c9016` as the expected initialization base | Its only change is the one-line repository title README | Work proceeds on `chore/m0-bootstrap-long-run`; `main` remains untouched |
| D-002 | Replace the user-specific local path in the Task Packet snapshot with `<PROJECT_ROOT>` | Required Public Repository Boundary | Snapshot remains semantically complete without exposing a personal environment path |
| D-003 | Force LF for repository text formats | Makes the recorded SHA-256 reproducible across Windows and CI checkouts | `.gitattributes` is part of the M0 foundation |
| D-004 | Keep `src/engine` framework-independent and demonstrate the boundary with a trivial metadata export | M0 must prove structure, not migrate calculations | No solar model or MVP logic is introduced |
| D-005 | Do not create placeholder empty directories | `.gitkeep` use is explicitly discouraged | Directories appear only when they contain a meaningful file |
