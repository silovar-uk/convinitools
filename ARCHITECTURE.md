# convinitools architecture

## Goal

convinitools is a Chrome Side Panel workbench. The architecture optimizes for:
- fast opening
- low cognitive load
- safe feature addition/removal
- short-lived transient state
- minimal cross-feature coupling
- predictable keyboard and context-menu behavior

## Runtime structure

```text
sidepanel.js             thin bootstrap
app-core.js              shared registry / IDs / storage keys

core/
  tabs.js                tab navigation + persistence
  ui.js                  shared UI helpers

features/
  template.js
  linebreak.js
  zenhan.js
  calendar.js
  markdown.js
  html-stripper.js
  random.js

background.js            browser-level integrations only
```

## Responsibility rule

### sidepanel.js

Allowed:
- initialize controllers and features
- coordinate cross-feature handoff
- listen for extension-level storage events

Not allowed:
- feature-specific DOM queries
- conversion algorithms
- feature-specific form state
- large rendering logic

### features/*.js

Each feature:
- owns its DOM queries
- owns its event listeners
- owns its transformation/rendering logic
- exports one `init...` entry point
- exposes only the smallest API needed by other modules

Example: right-click handoff does not know the Line Break input DOM ID. It only calls `lineBreak.setText(text)`.

### core/*.js

Reusable UI infrastructure only. It must not know business details of an individual tool.

### app-core.js

Single source of truth shared by the panel and Service Worker:
- tool IDs
- default tool
- context-menu definitions
- storage keys
- transient-action TTL

## State policy

- `chrome.storage.local`: durable preference, such as last-used tool
- `chrome.storage.session`: transient handoff from context menu
- legacy `localStorage`: migration read only; do not add new writes

Transient handoffs expire after 60 seconds.

## UX / Shuhari

### Shu

Preserve familiar controls and existing output behavior. Refactors should not force the user to relearn a tool.

### Ha

Reduce accidental coupling:
- inactive tabs stay quiet
- individual tools own their own code
- browser integration uses public feature APIs instead of reaching into DOM
- keyboard navigation follows tab conventions

### Ri

The next stage is capability-driven composition:
- registry metadata can declare feature capabilities
- context-menu integration can be derived from capabilities
- optional command palette / quick switcher can call the same feature APIs
- tests can target a feature without booting the entire panel

The goal is not abstraction for its own sake. The goal is local change: editing one tool should normally require editing one feature module.

## Verification

Run:

```bash
npm run verify
```

It checks syntax plus structural invariants, including:
- Manifest V3
- tool registry ↔ tabs ↔ panels
- unique IDs
- one initial active tool
- no legacy Reds search residue
- no unused theme CSS
- no inline style attributes
- required modules exist
- every feature exports an initializer
- sidepanel.js stays thin
