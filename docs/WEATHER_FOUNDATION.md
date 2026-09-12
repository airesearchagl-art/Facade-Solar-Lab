# Weather Foundation

M2 adds a deterministic EPW-to-facade-energy foundation alongside the unchanged M1 Legacy engine. It is weather-backed, but it is not a fully validated physical-performance model.

## Authoritative sources

Accessed `2026-09-12`:

- [EnergyPlus 26.1 Auxiliary Programs / EPW data dictionary](https://bigladdersoftware.com/epx/docs/26-1/auxiliary-programs/auxiliary-programs.html#energyplus-weather-file-epw-data-dictionary)
- [NOAA/GML Solar Calculation Details](https://www.gml.noaa.gov/grad/solcalc/calcdetails.html)
- [NOAA/GML old Solar Position Calculator](https://www.gml.noaa.gov/grad/solcalc/azel.html)
- [EnergyPlus Tokyo Hyakuri IWEC archive](https://energyplus-weather.s3.amazonaws.com/asia_wmo_region_2/JPN/JPN_Tokyo.Hyakuri.477150_IWEC/JPN_Tokyo.Hyakuri.477150_IWEC.zip)

The EnergyPlus specification defines eight ordered headers, `Hour` 1–24, `Minute` 1–60, and GHI/DNI/DHI as `Wh/m²` accumulated during the minutes preceding the indicated time. Radiation missing values are represented by 9999. EnergyPlus may substitute zero internally for some missing radiation; this project deliberately does not reproduce that behavior.

## Canonical contract

`src/weather/` accepts EPW text and returns:

- `WeatherDataset`: stable ID, location, interval metadata, coverage, provenance, issues, and intervals.
- `WeatherLocation`: city/region/country/source/station, north-positive latitude, east-positive longitude, UTC-to-local-standard-time offset, and elevation.
- `WeatherInterval`: explicit interval time, required radiation, source flags, and source line.
- `WeatherSourceProvenance`: source name/reference, retrieval date, and adapter-supplied source SHA-256.
- `WeatherParseIssue`: severity, stable code, message, source line, field, and raw value.

The core parser receives a string. File/network/browser adapters are outside the core.

## Time and energy

EPW location Local Standard Time is canonical. DST, host `Date`, host time zone, and implicit UTC conversion are not used.

For raw EPW `year/month/day/hour/minute`, the represented radiation interval ends at the encoded time. Solar position and shading are evaluated once at the preceding interval's midpoint. For example, hourly `Hour=1, Minute=60` contains energy for 00:00–01:00 and uses 00:30 solar geometry. `Hour=24, Minute=60` ends at next-day 00:00 while its midpoint remains 23:30 on the record date.

Typical-year EPW files can retain different historical source years month by month. The raw year remains available in each interval, but full 8,760-record solar evaluation uses a canonical non-leap Gregorian year and 8,784-record evaluation uses a canonical leap year. This prevents a source leap-year March from shifting a non-leap typical-year solar calendar.

GHI, DNI, and DHI remain `Wh/m² interval`. Facade interval energy is:

```text
DNI × vertical beam incidence × direct-lit fraction
+ DHI × vertical sky-view factor
+ GHI × ground reflectance × 0.5
```

Area and SHGC convert this once to kWh. Interval duration is not multiplied again. A quarter-hour regression test prevents the common `Wh`/`W` double-integration error.

## Missing and malformed data

Structural header or unsupported DATA PERIODS metadata is fatal. Readable rows retain diagnostics:

- absent, non-numeric, or `>=9999` required radiation becomes `null` plus `RADIATION_MISSING`;
- negative required radiation becomes `null` plus `RADIATION_INVALID`;
- malformed date/time/row values are not silently normalized into records.

The default weather-v1 simulation rejects any error-bearing dataset. No implicit interpolation or zero-fill policy exists in M2.

## Solar position v1

`noaa-fractional-year-v1` uses NOAA's documented fractional-year equation-of-time and declination approximation with latitude, longitude, UTC offset, calendar date, and Local Standard Time. Its fractional-year denominator is 365 days in a normal year and 366 days in a Gregorian leap year. Azimuth is degrees clockwise from north. Geometric elevation drives incidence/shading; NOAA's piecewise approximate refraction correction is exposed separately for calculator comparison.

Independent values were transcribed from the NOAA/GML calculator for Tokyo (35°42′ N, 139°46′ E, UTC+9) on 2026-09-12. Normal-year references cover 2025 equinox morning/noon/afternoon and summer/winter noon. Leap-year references cover 2024-02-29, 2024-06-21, and the late-year date 2024-12-21 at noon. NOAA rounds its output to 0.01°; the simplified implementation retains the established 0.5° comparison tolerance. NOAA states that the calculator is no longer actively maintained and is approximate, so M2 makes no SPA/high-precision claim.

## Irradiance and geometry limits

- Diffuse sky is isotropic. Perez/anisotropic/circumsolar/horizon-brightening models are deferred.
- The vertical-surface unshaded sky and ground view factors are each 0.5.
- Ground reflection is `GHI × groundReflectance × 0.5`; overhang obstruction of ground reflection is deferred.
- Overhang shading is the current 20-strip 2D horizontal-depth model. Finite width, side fins, reveals, multiple obstructions, and 3D geometry are deferred to M3.
- One midpoint solar position represents the whole radiation interval. Intra-interval solar motion/interpolation is deferred to later validation.

## Real-file smoke validation

Status: `PASS` for parser/simulation completion; not an external accuracy validation.

| Item | Evidence |
| --- | --- |
| Dataset | Tokyo Hyakuri, JPN, WMO 477150, IWEC |
| Location | 36.18° N, 140.42° E, UTC+9, 35 m |
| Retrieved | 2026-09-12 |
| ZIP SHA-256 | `65F7DFC78762753A8CCCA36F47C76F37397237247DC755E46D648A8D0505BF69` |
| EPW SHA-256 | `3D3781E80F39851D80D1B445D94DEFD0C69CD74574B89DDB6E17C0575064612E` |
| Records/issues | 8,760 / 0 |
| Missing required solar | 0 |
| Annual GHI/DNI/DHI | 1,306,833 / 935,343 / 736,369 Wh/m² |

The archive includes an ASHRAE IWEC license that restricts copying, transfer, and third-party distribution. The raw ZIP, EPW, and license were used on one machine under `.local-validation/`, which is Git-ignored. None is committed or redistributed. Repository evidence contains only source reference, hashes, metadata, aggregates, and results.

## M1 versus M2

Common geometry: H 2.4 m, D 1.6 m, O 0.3 m, W 6 m, south facade, SHGC 1, ground reflectance 0.2.

| Model/period | With overhang [kWh] | Without [kWh] | Reduction |
| --- | ---: | ---: | ---: |
| legacy-v01 annual | 14,486.66 | 25,890.12 | 44.05% |
| weather-v1 annual | 8,399.84 | 13,610.63 | 38.28% |
| legacy-v01 cooling | 4,254.15 | 10,115.80 | 57.95% |
| weather-v1 cooling | 3,398.52 | 6,111.48 | 44.39% |
| legacy-v01 heating | 10,232.51 | 15,774.32 | 35.13% |
| weather-v1 heating | 5,001.32 | 7,499.15 | 33.31% |

M1 is a clear-sky regression baseline at its own legacy location/sky assumptions. M2 uses real weather and independent solar position. The numerical difference is expected and is not a pass/fail accuracy comparison.

M3 should expand facade geometry without changing either baseline silently. M5 should add third-party solar/irradiance comparisons, higher-precision/intra-interval studies, additional weather sources, and quantified physical-model validation before absolute kWh is used as formal evidence.
