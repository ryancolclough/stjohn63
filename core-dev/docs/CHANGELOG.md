# CORE Platform 1.6.2.2

Build: `20260713.003`
Release ID: `CORE-DEV-REL-009-HF2`

## Fixed
- Removed the fragile global `moduleLoadLog` variable.
- Module telemetry now lives permanently at `PLATFORM.moduleLoadLog`.
- Diagnostics can initialize safely before module telemetry has finished loading.
- Dashboard System Health cannot crash the platform during startup.
- Added another cache-key change so Safari loads the complete matching build.

## Root Cause
Safari loaded a mixed release in which diagnostics referenced `moduleLoadLog`, but the matching declaration was not available in the active platform script. Telemetry is now stored directly on the platform object, eliminating that dependency.
