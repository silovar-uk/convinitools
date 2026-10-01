import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const manifest = JSON.parse(read('manifest.json'));
const html = read('sidepanel.html');
const js = read('sidepanel.js');
const css = read('style.css');
const core = read('app-core.js');
const bootstrap = read('sidepanel.js');

const featureFiles = [
    'features/template.js',
    'features/linebreak.js',
    'features/zenhan.js',
    'features/calendar.js',
    'features/markdown.js',
    'features/html-stripper.js',
    'features/random.js'
];
const coreFiles = ['core/ui.js', 'core/tabs.js'];
const moduleFiles = [...coreFiles, ...featureFiles];

const failures = [];
const assert = (condition, message) => {
    if (!condition) failures.push(message);
};

assert(manifest.manifest_version === 3, 'manifest_version must be 3');
assert(manifest.background?.type === 'module', 'background service worker must be module');
assert(Number(manifest.minimum_chrome_version) >= 116, 'minimum Chrome version must be 116+');

const tabTargets = [...html.matchAll(/class="tab-btn[^"]*"[^>]*data-target="([^"]+)"/g)].map(m => m[1]);
const panelIds = [...html.matchAll(/id="([^"]+)" class="tab-content/g)].map(m => m[1]);

assert(tabTargets.length > 0, 'at least one tab is required');
assert(new Set(tabTargets).size === tabTargets.length, 'tab targets must be unique');
assert(new Set(panelIds).size === panelIds.length, 'panel ids must be unique');
assert(tabTargets.every(id => panelIds.includes(id)), 'every tab must have a matching panel');
assert(panelIds.every(id => tabTargets.includes(id)), 'every panel must have a matching tab');

const activeTabs = [...html.matchAll(/class="tab-btn active[^"]*"/g)].length;
const activePanels = [...html.matchAll(/class="tab-content active[^"]*"/g)].length;
assert(activeTabs === 1, 'exactly one tab must be active in HTML');
assert(activePanels === 1, 'exactly one panel must be active in HTML');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert(new Set(ids).size === ids.length, 'HTML ids must be unique');

const forbidden = [
    /レッズ/i,
    /urawa-reds/i,
    /REDSOFFICIAL/i,
    /contentReds/i,
    /redsSearch/i,
    /color-reds/i,
    /theme-reds/i
];
const allRuntimeSource = [
    html,
    js,
    css,
    core,
    ...moduleFiles.map(read)
].join('\n');

for (const pattern of forbidden) {
    assert(!pattern.test(allRuntimeSource), `legacy string remains: ${pattern}`);
}

assert(!/style="/.test(html), 'inline style attributes are not allowed');
assert(!/fonts\.googleapis\.com/.test(html), 'remote Google Fonts must not be loaded');
assert(/type="module" src="sidepanel\.js"/.test(html), 'sidepanel.js must load as a module');
assert(/storage\.session/.test(js), 'pending handoff must use storage.session');
assert(!/localStorage\.setItem\(LAST_TOOL_KEY/.test(js), 'last tool must not be stored in localStorage');
assert(/TOOL_REGISTRY/.test(core), 'tool registry is required');
assert(bootstrap.split('\n').length <= 180, 'sidepanel.js should remain a thin bootstrap');
assert(!/getElementById\(/.test(bootstrap), 'bootstrap should not own feature DOM queries');
assert(!/addEventListener\(['"]input['"]/.test(bootstrap), 'bootstrap should not own feature input events');

for (const file of moduleFiles) {
    const fullPath = path.join(root, file);
    assert(fs.existsSync(fullPath), `required module is missing: ${file}`);
}

for (const file of featureFiles) {
    const source = read(file);
    assert(/export const init[A-Za-z]+/.test(source), `feature must export an init function: ${file}`);
}

const registryIds = [...core.matchAll(/\bid: '(content[A-Za-z]+)'/g)].map(m => m[1]);
assert(registryIds.length === tabTargets.length, 'tool registry and tab count must match');
assert(registryIds.every(id => tabTargets.includes(id)), 'every registered tool must have a tab');
assert(tabTargets.every(id => registryIds.includes(id)), 'every tab must be registered');

const contextMenuIds = [...core.matchAll(/\bid: '(open_[^']+)'/g)].map(m => m[1]);
assert(new Set(contextMenuIds).size === contextMenuIds.length, 'context menu ids must be unique');

const cssThemeTokens = [...new Set([...css.matchAll(/\.(?:color|theme)-([a-z-]+)/g)].map(m => m[1]))];
const htmlThemeTokens = [...new Set([...html.matchAll(/(?:color|theme)-([a-z-]+)/g)].map(m => m[1]))];
assert(
    cssThemeTokens.every(token => htmlThemeTokens.includes(token)),
    'CSS contains an unused tool theme'
);

if (failures.length) {
    console.error('Verification failed:');
    failures.forEach(item => console.error(`- ${item}`));
    process.exit(1);
}

console.log(`Verification passed: ${manifest.name} v${manifest.version}`);
console.log(`Tabs: ${tabTargets.length}`);
