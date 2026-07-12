# CORE Platform 1.5.0-dev — Hotfix 2

Build: `20260712.008`  
Release ID: `CORE-DEV-REL-006-HF2`

## Fixed
- Tapping Assigned Officer could activate the fixed Settings control on iPhone.
- Bottom navigation now hides while an Action form field is focused.
- Focused fields scroll into the visible area above the iPhone keyboard.
- Form controls receive isolated touch handling.
- Added extra bottom clearance to the Action editor.

## Cause
The fixed bottom dock could overlap the mobile form during keyboard activation and intercept the tap.
