# CORE Platform 1.3.0-dev Hotfix 2

Build: `20260712.004`  
Release ID: `CORE-DEV-REL-004-HF2`

## Fixed
- Restored missing `state.annualSettings()`
- Restored missing `state.saveAnnualSettings()`
- Restored missing `state.annualQueue()`
- Restored missing `state.annualArticleProgress()`
- Annual Dashboard card can now calculate the queue without crashing the platform

## Cause
The Annual module loaded correctly, but its required state helpers were not present in the deployed `app.js`.
