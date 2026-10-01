# convinitools architecture

## Goal

convinitools is a small Chrome Side Panel toolbox. The architecture should optimize for:
- fast opening
- low cognitive load
- safe feature addition/removal
- no stale state across browser restarts
- minimal permissions and external dependencies

## Current structure

- `manifest.json`
  - Manifest V3
  - Chrome 116+
  - loads the Side Panel and module-based Service Worker

- `app-core.js`
  - single source of truth for tool IDs
  - context-menu definitions
  - storage keys
  - default tool
  - transient handoff validation

- `background.js`
  - owns browser-level integrations only
  - creates context menus from `app-core.js`
  - sends selected text through `chrome.storage.session`
  - opens the Side Panel after a user gesture

- `sidepanel.html`
  - semantic UI shell
  - tabs / tabpanels / form controls
  - no inline styles
  - no remote font dependency

- `sidepanel.js`
  - currently owns feature behavior
  - reads shared definitions from `app-core.js`
  - restores the last-used tool through `chrome.storage.local`
  - consumes short-lived handoff data from `chrome.storage.session`

- `style.css`
  - presentation only
  - tool-specific accent themes
  - keyboard focus and reduced-motion support

- `scripts/verify.mjs`
  - structural smoke test for the repository

## State policy

Use the smallest persistence scope that matches the user's expectation.

- `chrome.storage.local`
  - settings and durable UI preference
  - example: last-used tool

- `chrome.storage.session`
  - transient browser-session state
  - example: selected text handed off from a context menu

Do not use localStorage for new state.

## Tool registry rule

A tool ID must be registered in `app-core.js` and must have exactly one matching:
- tab button
- tab panel

Context-menu actions must also be declared in the registry. Do not hard-code tool IDs separately in `background.js`.

## UX rule

The Side Panel is a workbench, not a dashboard.

- inactive tools stay visually quiet
- the current tool owns the accent color
- reopening returns to the last-used tool
- right-click handoffs focus the destination input immediately
- keyboard tab navigation follows the standard Left / Right / Home / End pattern
- transient actions expire instead of surprising the user later

## Shuhari roadmap

### Shu — preserve reliability

Completed:
- one valid default tool
- semantic tab structure
- durable and transient state separated
- no remote font request
- inline styles removed
- automated structural checks

### Ha — separate feature modules

Next refactor target:
1. extract the calendar first because it is the largest and most stateful feature
2. extract Markdown conversion second because its sanitization rules are self-contained
3. move remaining simple tools into small `features/*.js` modules
4. keep `sidepanel.js` as a thin bootstrap layer

Each extraction should preserve existing DOM IDs and behavior before any UI redesign.

### Ri — capability-driven workbench

After modularization:
- each feature exports metadata + an `init()` function
- the registry can drive tabs, context menus, keyboard routing, and future commands
- adding or removing a tool becomes a local change instead of editing multiple unrelated files

The end state is not “more abstraction.” The end state is a tool that is easier to change without the user noticing that anything complicated happened behind the scenes.
