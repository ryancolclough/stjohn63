# CORE Platform 1.6.2.3

Build: `20260713.004`
Release ID: `CORE-DEV-REL-009-HF3`

## Fixed
- Corrected two malformed telemetry properties that prevented Safari from parsing `app.js`.
- Restored the platform `moduleLoadLog` array.
- Corrected the diagnostic snapshot property to use the safe `loadLog` value.
- Added a visible startup error fallback.
- Updated cache keys and patch versions.

## Root Cause
The previous build contained invalid object-literal syntax:
- `PLATFORM.moduleLoadLog:[]`
- `PLATFORM.moduleLoadLog:[...moduleLoadLog]`

Those entries prevented the application script from parsing, resulting in a black screen.
