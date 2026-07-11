# CORE Architecture

## Platform
`js/app.js` boots CORE, loads the module registry, registers modules, and starts routing.

## SDK
Shared services live in `/sdk`:
- storage
- events
- router
- themes
- dialogs
- UI helpers

## Modules
Each feature owns its JavaScript, CSS, and manifest.

Modules do not directly modify one another. They communicate through the event bus and platform services.
