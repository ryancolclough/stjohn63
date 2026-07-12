# CORE Platform 1.5.0-dev — Hotfix 1

Build: `20260712.007`  
Release ID: `CORE-DEV-REL-006-HF1`

## Fixed
- Action Centre routing could open the wrong module when Safari mixed cached platform and module files.
- Added build-specific cache keys to CSS, platform JavaScript, module registry, and dynamic module imports.
- Route clicks now stop after the selected route is handled.
- Action Centre route registration is verified during startup.
- Action Centre loads before Settings in the module registry.

## Diagnostic
The browser console now lists every loaded route and module version.
