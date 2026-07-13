# CORE Platform 1.5.0-dev — Hotfix 5

Build: `20260712.011`  
Release ID: `CORE-DEV-REL-006-HF5`

## Fixed
- Every click in CORE could redirect to Settings.
- New Action, Action form fields, filters, and other controls now run their intended handlers.
- Theme switching is now restricted to the three buttons inside Settings → Appearance.

## Root Cause
The Settings module used:

`e.target.closest("[data-theme]")`

The root `<html>` element also has `data-theme="system"`, so every click anywhere in CORE matched the HTML element and triggered:

`router.go("settings")`

The handler now matches only:

`button[data-theme]`

inside `.theme-options`.
