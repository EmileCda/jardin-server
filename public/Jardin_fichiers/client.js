import '/node_modules/vite/dist/client/env.mjs';

const base$1 = "/" || '/';
// set :host styles to make playwright detect the element as visible
const template = /*html*/ `
<style>
:host {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 99999;
  --monospace: 'SFMono-Regular', Consolas,
  'Liberation Mono', Menlo, Courier, monospace;
  --red: #ff5555;
  --yellow: #e2aa53;
  --purple: #cfa4ff;
  --cyan: #2dd9da;
  --dim: #c9c9c9;

  --window-background: #181818;
  --window-color: #d8d8d8;
}

.backdrop {
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  margin: 0;
  background: rgba(0, 0, 0, 0.66);
}

.window {
  font-family: var(--monospace);
  line-height: 1.5;
  width: 800px;
  color: var(--window-color);
  margin: 30px auto;
  padding: 25px 40px;
  position: relative;
  background: var(--window-background);
  border-radius: 6px 6px 8px 8px;
  box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);
  overflow: hidden;
  border-top: 8px solid var(--red);
  direction: ltr;
  text-align: left;
}

pre {
  font-family: var(--monospace);
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 1em;
  overflow-x: scroll;
  scrollbar-width: none;
}

pre::-webkit-scrollbar {
  display: none;
}

.message {
  line-height: 1.3;
  font-weight: 600;
  white-space: pre-wrap;
}

.message-body {
  color: var(--red);
}

.plugin {
  color: var(--purple);
}

.file {
  color: var(--cyan);
  margin-bottom: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.frame {
  color: var(--yellow);
}

.stack {
  font-size: 13px;
  color: var(--dim);
}

.tip {
  font-size: 13px;
  color: #999;
  border-top: 1px dotted #999;
  padding-top: 13px;
}

code {
  font-size: 13px;
  font-family: var(--monospace);
  color: var(--yellow);
}

.file-link {
  text-decoration: underline;
  cursor: pointer;
}
</style>
<div class="backdrop" part="backdrop">
  <div class="window" part="window">
    <pre class="message" part="message"><span class="plugin" part="plugin"></span><span class="message-body" part="message-body"></span></pre>
    <pre class="file" part="file"></pre>
    <pre class="frame" part="frame"></pre>
    <pre class="stack" part="stack"></pre>
    <div class="tip" part="tip">
      Click outside or fix the code to dismiss.<br>
      You can also disable this overlay by setting
      <code part="config-option-name">server.hmr.overlay</code> to <code part="config-option-value">false</code> in <code part="config-file-name">vite.config.js.</code>
    </div>
  </div>
</div>
`;
const fileRE = /(?:[a-zA-Z]:\\|\/).*?:\d+:\d+/g;
const codeframeRE = /^(?:>?\s+\d+\s+\|.*|\s+\|\s*\^.*)\r?\n/gm;
// Allow `ErrorOverlay` to extend `HTMLElement` even in environments where
// `HTMLElement` was not originally defined.
const { HTMLElement = class {
} } = globalThis;
class ErrorOverlay extends HTMLElement {
    constructor(err, links = true) {
        var _a;
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.root.innerHTML = template;
        codeframeRE.lastIndex = 0;
        const hasFrame = err.frame && codeframeRE.test(err.frame);
        const message = hasFrame
            ? err.message.replace(codeframeRE, '')
            : err.message;
        if (err.plugin) {
            this.text('.plugin', `[plugin:${err.plugin}] `);
        }
        this.text('.message-body', message.trim());
        const [file] = (((_a = err.loc) === null || _a === void 0 ? void 0 : _a.file) || err.id || 'unknown file').split(`?`);
        if (err.loc) {
            this.text('.file', `${file}:${err.loc.line}:${err.loc.column}`, links);
        }
        else if (err.id) {
            this.text('.file', file);
        }
        if (hasFrame) {
            this.text('.frame', err.frame.trim());
        }
        this.text('.stack', err.stack, links);
        this.root.querySelector('.window').addEventListener('click', (e) => {
            e.stopPropagation();
        });
        this.addEventListener('click', () => {
            this.close();
        });
    }
    text(selector, text, linkFiles = false) {
        const el = this.root.querySelector(selector);
        if (!linkFiles) {
            el.textContent = text;
        }
        else {
            let curIndex = 0;
            let match;
            fileRE.lastIndex = 0;
            while ((match = fileRE.exec(text))) {
                const { 0: file, index } = match;
                if (index != null) {
                    const frag = text.slice(curIndex, index);
                    el.appendChild(document.createTextNode(frag));
                    const link = document.createElement('a');
                    link.textContent = file;
                    link.className = 'file-link';
                    link.onclick = () => {
                        fetch(`${base$1}__open-in-editor?file=` + encodeURIComponent(file));
                    };
                    el.appendChild(link);
                    curIndex += frag.length + file.length;
                }
            }
        }
    }
    close() {
        var _a;
        (_a = this.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(this);
    }
}
const overlayId = 'vite-error-overlay';
const { customElements } = globalThis; // Ensure `customElements` is defined before the next line.
if (customElements && !customElements.get(overlayId)) {
    customElements.define(overlayId, ErrorOverlay);
}

console.debug('[vite] connecting...');
const importMetaUrl = new URL(import.meta.url);
// use server configuration, then fallback to inference
const serverHost = "localhost:5173/";
const socketProtocol = null || (importMetaUrl.protocol === 'https:' ? 'wss' : 'ws');
const hmrPort = null;
const socketHost = `${null || importMetaUrl.hostname}:${hmrPort || importMetaUrl.port}${"/"}`;
const directSocketHost = "localhost:5173/";
const base = "/" || '/';
const messageBuffer = [];
let socket;
try {
    let fallback;
    // only use fallback when port is inferred to prevent confusion
    if (!hmrPort) {
        fallback = () => {
            // fallback to connecting directly to the hmr server
            // for servers which does not support proxying websocket
            socket = setupWebSocket(socketProtocol, directSocketHost, () => {
                const currentScriptHostURL = new URL(import.meta.url);
                const currentScriptHost = currentScriptHostURL.host +
                    currentScriptHostURL.pathname.replace(/@vite\/client$/, '');
                console.error('[vite] failed to connect to websocket.\n' +
                    'your current setup:\n' +
                    `  (browser) ${currentScriptHost} <--[HTTP]--> ${serverHost} (server)\n` +
                    `  (browser) ${socketHost} <--[WebSocket (failing)]--> ${directSocketHost} (server)\n` +
                    'Check out your Vite / network configuration and https://vitejs.dev/config/server-options.html#server-hmr .');
            });
            socket.addEventListener('open', () => {
                console.info('[vite] Direct websocket connection fallback. Check out https://vitejs.dev/config/server-options.html#server-hmr to remove the previous connection error.');
            }, { once: true });
        };
    }
    socket = setupWebSocket(socketProtocol, socketHost, fallback);
}
catch (error) {
    console.error(`[vite] failed to connect to websocket (${error}). `);
}
function setupWebSocket(protocol, hostAndPath, onCloseWithoutOpen) {
    const socket = new WebSocket(`${protocol}://${hostAndPath}`, 'vite-hmr');
    let isOpened = false;
    socket.addEventListener('open', () => {
        isOpened = true;
    }, { once: true });
    // Listen for messages
    socket.addEventListener('message', async ({ data }) => {
        handleMessage(JSON.parse(data));
    });
    // ping server
    socket.addEventListener('close', async ({ wasClean }) => {
        if (wasClean)
            return;
        if (!isOpened && onCloseWithoutOpen) {
            onCloseWithoutOpen();
            return;
        }
        console.log(`[vite] server connection lost. polling for restart...`);
        await waitForSuccessfulPing(protocol, hostAndPath);
        location.reload();
    });
    return socket;
}
function warnFailedFetch(err, path) {
    if (!err.message.match('fetch')) {
        console.error(err);
    }
    console.error(`[hmr] Failed to reload ${path}. ` +
        `This could be due to syntax errors or importing non-existent ` +
        `modules. (see errors above)`);
}
function cleanUrl(pathname) {
    const url = new URL(pathname, location.toString());
    url.searchParams.delete('direct');
    return url.pathname + url.search;
}
let isFirstUpdate = true;
const outdatedLinkTags = new WeakSet();
async function handleMessage(payload) {
    switch (payload.type) {
        case 'connected':
            console.debug(`[vite] connected.`);
            sendMessageBuffer();
            // proxy(nginx, docker) hmr ws maybe caused timeout,
            // so send ping package let ws keep alive.
            setInterval(() => {
                if (socket.readyState === socket.OPEN) {
                    socket.send('{"type":"ping"}');
                }
            }, 30000);
            break;
        case 'update':
            notifyListeners('vite:beforeUpdate', payload);
            // if this is the first update and there's already an error overlay, it
            // means the page opened with existing server compile error and the whole
            // module script failed to load (since one of the nested imports is 500).
            // in this case a normal update won't work and a full reload is needed.
            if (isFirstUpdate && hasErrorOverlay()) {
                window.location.reload();
                return;
            }
            else {
                clearErrorOverlay();
                isFirstUpdate = false;
            }
            await Promise.all(payload.updates.map(async (update) => {
                if (update.type === 'js-update') {
                    return queueUpdate(fetchUpdate(update));
                }
                // css-update
                // this is only sent when a css file referenced with <link> is updated
                const { path, timestamp } = update;
                const searchUrl = cleanUrl(path);
                // can't use querySelector with `[href*=]` here since the link may be
                // using relative paths so we need to use link.href to grab the full
                // URL for the include check.
                const el = Array.from(document.querySelectorAll('link')).find((e) => !outdatedLinkTags.has(e) && cleanUrl(e.href).includes(searchUrl));
                if (!el) {
                    return;
                }
                const newPath = `${base}${searchUrl.slice(1)}${searchUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
                // rather than swapping the href on the existing tag, we will
                // create a new link tag. Once the new stylesheet has loaded we
                // will remove the existing link tag. This removes a Flash Of
                // Unstyled Content that can occur when swapping out the tag href
                // directly, as the new stylesheet has not yet been loaded.
                return new Promise((resolve) => {
                    const newLinkTag = el.cloneNode();
                    newLinkTag.href = new URL(newPath, el.href).href;
                    const removeOldEl = () => {
                        el.remove();
                        console.debug(`[vite] css hot updated: ${searchUrl}`);
                        resolve();
                    };
                    newLinkTag.addEventListener('load', removeOldEl);
                    newLinkTag.addEventListener('error', removeOldEl);
                    outdatedLinkTags.add(el);
                    el.after(newLinkTag);
                });
            }));
            notifyListeners('vite:afterUpdate', payload);
            break;
        case 'custom': {
            notifyListeners(payload.event, payload.data);
            break;
        }
        case 'full-reload':
            notifyListeners('vite:beforeFullReload', payload);
            if (payload.path && payload.path.endsWith('.html')) {
                // if html file is edited, only reload the page if the browser is
                // currently on that page.
                const pagePath = decodeURI(location.pathname);
                const payloadPath = base + payload.path.slice(1);
                if (pagePath === payloadPath ||
                    payload.path === '/index.html' ||
                    (pagePath.endsWith('/') && pagePath + 'index.html' === payloadPath)) {
                    location.reload();
                }
                return;
            }
            else {
                location.reload();
            }
            break;
        case 'prune':
            notifyListeners('vite:beforePrune', payload);
            // After an HMR update, some modules are no longer imported on the page
            // but they may have left behind side effects that need to be cleaned up
            // (.e.g style injections)
            // TODO Trigger their dispose callbacks.
            payload.paths.forEach((path) => {
                const fn = pruneMap.get(path);
                if (fn) {
                    fn(dataMap.get(path));
                }
            });
            break;
        case 'error': {
            notifyListeners('vite:error', payload);
            const err = payload.err;
            if (enableOverlay) {
                createErrorOverlay(err);
            }
            else {
                console.error(`[vite] Internal Server Error\n${err.message}\n${err.stack}`);
            }
            break;
        }
        default: {
            const check = payload;
            return check;
        }
    }
}
function notifyListeners(event, data) {
    const cbs = customListenersMap.get(event);
    if (cbs) {
        cbs.forEach((cb) => cb(data));
    }
}
const enableOverlay = true;
function createErrorOverlay(err) {
    if (!enableOverlay)
        return;
    clearErrorOverlay();
    document.body.appendChild(new ErrorOverlay(err));
}
function clearErrorOverlay() {
    document
        .querySelectorAll(overlayId)
        .forEach((n) => n.close());
}
function hasErrorOverlay() {
    return document.querySelectorAll(overlayId).length;
}
let pending = false;
let queued = [];
/**
 * buffer multiple hot updates triggered by the same src change
 * so that they are invoked in the same order they were sent.
 * (otherwise the order may be inconsistent because of the http request round trip)
 */
async function queueUpdate(p) {
    queued.push(p);
    if (!pending) {
        pending = true;
        await Promise.resolve();
        pending = false;
        const loading = [...queued];
        queued = [];
        (await Promise.all(loading)).forEach((fn) => fn && fn());
    }
}
async function waitForSuccessfulPing(socketProtocol, hostAndPath, ms = 1000) {
    const pingHostProtocol = socketProtocol === 'wss' ? 'https' : 'http';
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            // A fetch on a websocket URL will return a successful promise with status 400,
            // but will reject a networking error.
            // When running on middleware mode, it returns status 426, and an cors error happens if mode is not no-cors
            await fetch(`${pingHostProtocol}://${hostAndPath}`, {
                mode: 'no-cors',
            });
            break;
        }
        catch (e) {
            // wait ms before attempting to ping again
            await new Promise((resolve) => setTimeout(resolve, ms));
        }
    }
}
const sheetsMap = new Map();
// all css imports should be inserted at the same position
// because after build it will be a single css file
let lastInsertedStyle;
function updateStyle(id, content) {
    let style = sheetsMap.get(id);
    if (!style) {
        style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.setAttribute('data-vite-dev-id', id);
        style.textContent = content;
        if (!lastInsertedStyle) {
            document.head.appendChild(style);
            // reset lastInsertedStyle after async
            // because dynamically imported css will be splitted into a different file
            setTimeout(() => {
                lastInsertedStyle = undefined;
            }, 0);
        }
        else {
            lastInsertedStyle.insertAdjacentElement('afterend', style);
        }
        lastInsertedStyle = style;
    }
    else {
        style.textContent = content;
    }
    sheetsMap.set(id, style);
}
function removeStyle(id) {
    const style = sheetsMap.get(id);
    if (style) {
        document.head.removeChild(style);
        sheetsMap.delete(id);
    }
}
async function fetchUpdate({ path, acceptedPath, timestamp, explicitImportRequired, }) {
    const mod = hotModulesMap.get(path);
    if (!mod) {
        // In a code-splitting project,
        // it is common that the hot-updating module is not loaded yet.
        // https://github.com/vitejs/vite/issues/721
        return;
    }
    let fetchedModule;
    const isSelfUpdate = path === acceptedPath;
    // determine the qualified callbacks before we re-import the modules
    const qualifiedCallbacks = mod.callbacks.filter(({ deps }) => deps.includes(acceptedPath));
    if (isSelfUpdate || qualifiedCallbacks.length > 0) {
        const disposer = disposeMap.get(acceptedPath);
        if (disposer)
            await disposer(dataMap.get(acceptedPath));
        const [acceptedPathWithoutQuery, query] = acceptedPath.split(`?`);
        try {
            fetchedModule = await import(
            /* @vite-ignore */
            base +
                acceptedPathWithoutQuery.slice(1) +
                `?${explicitImportRequired ? 'import&' : ''}t=${timestamp}${query ? `&${query}` : ''}`);
        }
        catch (e) {
            warnFailedFetch(e, acceptedPath);
        }
    }
    return () => {
        for (const { deps, fn } of qualifiedCallbacks) {
            fn(deps.map((dep) => (dep === acceptedPath ? fetchedModule : undefined)));
        }
        const loggedPath = isSelfUpdate ? path : `${acceptedPath} via ${path}`;
        console.debug(`[vite] hot updated: ${loggedPath}`);
    };
}
function sendMessageBuffer() {
    if (socket.readyState === 1) {
        messageBuffer.forEach((msg) => socket.send(msg));
        messageBuffer.length = 0;
    }
}
const hotModulesMap = new Map();
const disposeMap = new Map();
const pruneMap = new Map();
const dataMap = new Map();
const customListenersMap = new Map();
const ctxToListenersMap = new Map();
function createHotContext(ownerPath) {
    if (!dataMap.has(ownerPath)) {
        dataMap.set(ownerPath, {});
    }
    // when a file is hot updated, a new context is created
    // clear its stale callbacks
    const mod = hotModulesMap.get(ownerPath);
    if (mod) {
        mod.callbacks = [];
    }
    // clear stale custom event listeners
    const staleListeners = ctxToListenersMap.get(ownerPath);
    if (staleListeners) {
        for (const [event, staleFns] of staleListeners) {
            const listeners = customListenersMap.get(event);
            if (listeners) {
                customListenersMap.set(event, listeners.filter((l) => !staleFns.includes(l)));
            }
        }
    }
    const newListeners = new Map();
    ctxToListenersMap.set(ownerPath, newListeners);
    function acceptDeps(deps, callback = () => { }) {
        const mod = hotModulesMap.get(ownerPath) || {
            id: ownerPath,
            callbacks: [],
        };
        mod.callbacks.push({
            deps,
            fn: callback,
        });
        hotModulesMap.set(ownerPath, mod);
    }
    const hot = {
        get data() {
            return dataMap.get(ownerPath);
        },
        accept(deps, callback) {
            if (typeof deps === 'function' || !deps) {
                // self-accept: hot.accept(() => {})
                acceptDeps([ownerPath], ([mod]) => deps === null || deps === void 0 ? void 0 : deps(mod));
            }
            else if (typeof deps === 'string') {
                // explicit deps
                acceptDeps([deps], ([mod]) => callback === null || callback === void 0 ? void 0 : callback(mod));
            }
            else if (Array.isArray(deps)) {
                acceptDeps(deps, callback);
            }
            else {
                throw new Error(`invalid hot.accept() usage.`);
            }
        },
        // export names (first arg) are irrelevant on the client side, they're
        // extracted in the server for propagation
        acceptExports(_, callback) {
            acceptDeps([ownerPath], ([mod]) => callback === null || callback === void 0 ? void 0 : callback(mod));
        },
        dispose(cb) {
            disposeMap.set(ownerPath, cb);
        },
        prune(cb) {
            pruneMap.set(ownerPath, cb);
        },
        // Kept for backward compatibility (#11036)
        // @ts-expect-error untyped
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        decline() { },
        // tell the server to re-perform hmr propagation from this module as root
        invalidate(message) {
            notifyListeners('vite:invalidate', { path: ownerPath, message });
            this.send('vite:invalidate', { path: ownerPath, message });
            console.debug(`[vite] invalidate ${ownerPath}${message ? `: ${message}` : ''}`);
        },
        // custom events
        on(event, cb) {
            const addToMap = (map) => {
                const existing = map.get(event) || [];
                existing.push(cb);
                map.set(event, existing);
            };
            addToMap(customListenersMap);
            addToMap(newListeners);
        },
        send(event, data) {
            messageBuffer.push(JSON.stringify({ type: 'custom', event, data }));
            sendMessageBuffer();
        },
    };
    return hot;
}
/**
 * urls here are dynamic import() urls that couldn't be statically analyzed
 */
function injectQuery(url, queryToInject) {
    // skip urls that won't be handled by vite
    if (!url.startsWith('.') && !url.startsWith('/')) {
        return url;
    }
    // can't use pathname from URL since it may be relative like ../
    const pathname = url.replace(/#.*$/, '').replace(/\?.*$/, '');
    const { search, hash } = new URL(url, 'http://vitejs.dev');
    return `${pathname}?${queryToInject}${search ? `&` + search.slice(1) : ''}${hash || ''}`;
}

export { ErrorOverlay, createHotContext, injectQuery, removeStyle, updateStyle };
                                   

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50Lm1qcyIsInNvdXJjZXMiOlsib3ZlcmxheS50cyIsImNsaWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEVycm9yUGF5bG9hZCB9IGZyb20gJ3R5cGVzL2htclBheWxvYWQnXG5cbi8vIGluamVjdGVkIGJ5IHRoZSBobXIgcGx1Z2luIHdoZW4gc2VydmVkXG5kZWNsYXJlIGNvbnN0IF9fQkFTRV9fOiBzdHJpbmdcblxuY29uc3QgYmFzZSA9IF9fQkFTRV9fIHx8ICcvJ1xuXG4vLyBzZXQgOmhvc3Qgc3R5bGVzIHRvIG1ha2UgcGxheXdyaWdodCBkZXRlY3QgdGhlIGVsZW1lbnQgYXMgdmlzaWJsZVxuY29uc3QgdGVtcGxhdGUgPSAvKmh0bWwqLyBgXG48c3R5bGU+XG46aG9zdCB7XG4gIHBvc2l0aW9uOiBmaXhlZDtcbiAgdG9wOiAwO1xuICBsZWZ0OiAwO1xuICB3aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiAxMDAlO1xuICB6LWluZGV4OiA5OTk5OTtcbiAgLS1tb25vc3BhY2U6ICdTRk1vbm8tUmVndWxhcicsIENvbnNvbGFzLFxuICAnTGliZXJhdGlvbiBNb25vJywgTWVubG8sIENvdXJpZXIsIG1vbm9zcGFjZTtcbiAgLS1yZWQ6ICNmZjU1NTU7XG4gIC0teWVsbG93OiAjZTJhYTUzO1xuICAtLXB1cnBsZTogI2NmYTRmZjtcbiAgLS1jeWFuOiAjMmRkOWRhO1xuICAtLWRpbTogI2M5YzljOTtcblxuICAtLXdpbmRvdy1iYWNrZ3JvdW5kOiAjMTgxODE4O1xuICAtLXdpbmRvdy1jb2xvcjogI2Q4ZDhkODtcbn1cblxuLmJhY2tkcm9wIHtcbiAgcG9zaXRpb246IGZpeGVkO1xuICB6LWluZGV4OiA5OTk5OTtcbiAgdG9wOiAwO1xuICBsZWZ0OiAwO1xuICB3aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiAxMDAlO1xuICBvdmVyZmxvdy15OiBzY3JvbGw7XG4gIG1hcmdpbjogMDtcbiAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjY2KTtcbn1cblxuLndpbmRvdyB7XG4gIGZvbnQtZmFtaWx5OiB2YXIoLS1tb25vc3BhY2UpO1xuICBsaW5lLWhlaWdodDogMS41O1xuICB3aWR0aDogODAwcHg7XG4gIGNvbG9yOiB2YXIoLS13aW5kb3ctY29sb3IpO1xuICBtYXJnaW46IDMwcHggYXV0bztcbiAgcGFkZGluZzogMjVweCA0MHB4O1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIGJhY2tncm91bmQ6IHZhcigtLXdpbmRvdy1iYWNrZ3JvdW5kKTtcbiAgYm9yZGVyLXJhZGl1czogNnB4IDZweCA4cHggOHB4O1xuICBib3gtc2hhZG93OiAwIDE5cHggMzhweCByZ2JhKDAsMCwwLDAuMzApLCAwIDE1cHggMTJweCByZ2JhKDAsMCwwLDAuMjIpO1xuICBvdmVyZmxvdzogaGlkZGVuO1xuICBib3JkZXItdG9wOiA4cHggc29saWQgdmFyKC0tcmVkKTtcbiAgZGlyZWN0aW9uOiBsdHI7XG4gIHRleHQtYWxpZ246IGxlZnQ7XG59XG5cbnByZSB7XG4gIGZvbnQtZmFtaWx5OiB2YXIoLS1tb25vc3BhY2UpO1xuICBmb250LXNpemU6IDE2cHg7XG4gIG1hcmdpbi10b3A6IDA7XG4gIG1hcmdpbi1ib3R0b206IDFlbTtcbiAgb3ZlcmZsb3cteDogc2Nyb2xsO1xuICBzY3JvbGxiYXItd2lkdGg6IG5vbmU7XG59XG5cbnByZTo6LXdlYmtpdC1zY3JvbGxiYXIge1xuICBkaXNwbGF5OiBub25lO1xufVxuXG4ubWVzc2FnZSB7XG4gIGxpbmUtaGVpZ2h0OiAxLjM7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbn1cblxuLm1lc3NhZ2UtYm9keSB7XG4gIGNvbG9yOiB2YXIoLS1yZWQpO1xufVxuXG4ucGx1Z2luIHtcbiAgY29sb3I6IHZhcigtLXB1cnBsZSk7XG59XG5cbi5maWxlIHtcbiAgY29sb3I6IHZhcigtLWN5YW4pO1xuICBtYXJnaW4tYm90dG9tOiAwO1xuICB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLWFsbDtcbn1cblxuLmZyYW1lIHtcbiAgY29sb3I6IHZhcigtLXllbGxvdyk7XG59XG5cbi5zdGFjayB7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgY29sb3I6IHZhcigtLWRpbSk7XG59XG5cbi50aXAge1xuICBmb250LXNpemU6IDEzcHg7XG4gIGNvbG9yOiAjOTk5O1xuICBib3JkZXItdG9wOiAxcHggZG90dGVkICM5OTk7XG4gIHBhZGRpbmctdG9wOiAxM3B4O1xufVxuXG5jb2RlIHtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBmb250LWZhbWlseTogdmFyKC0tbW9ub3NwYWNlKTtcbiAgY29sb3I6IHZhcigtLXllbGxvdyk7XG59XG5cbi5maWxlLWxpbmsge1xuICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuPC9zdHlsZT5cbjxkaXYgY2xhc3M9XCJiYWNrZHJvcFwiIHBhcnQ9XCJiYWNrZHJvcFwiPlxuICA8ZGl2IGNsYXNzPVwid2luZG93XCIgcGFydD1cIndpbmRvd1wiPlxuICAgIDxwcmUgY2xhc3M9XCJtZXNzYWdlXCIgcGFydD1cIm1lc3NhZ2VcIj48c3BhbiBjbGFzcz1cInBsdWdpblwiIHBhcnQ9XCJwbHVnaW5cIj48L3NwYW4+PHNwYW4gY2xhc3M9XCJtZXNzYWdlLWJvZHlcIiBwYXJ0PVwibWVzc2FnZS1ib2R5XCI+PC9zcGFuPjwvcHJlPlxuICAgIDxwcmUgY2xhc3M9XCJmaWxlXCIgcGFydD1cImZpbGVcIj48L3ByZT5cbiAgICA8cHJlIGNsYXNzPVwiZnJhbWVcIiBwYXJ0PVwiZnJhbWVcIj48L3ByZT5cbiAgICA8cHJlIGNsYXNzPVwic3RhY2tcIiBwYXJ0PVwic3RhY2tcIj48L3ByZT5cbiAgICA8ZGl2IGNsYXNzPVwidGlwXCIgcGFydD1cInRpcFwiPlxuICAgICAgQ2xpY2sgb3V0c2lkZSBvciBmaXggdGhlIGNvZGUgdG8gZGlzbWlzcy48YnI+XG4gICAgICBZb3UgY2FuIGFsc28gZGlzYWJsZSB0aGlzIG92ZXJsYXkgYnkgc2V0dGluZ1xuICAgICAgPGNvZGUgcGFydD1cImNvbmZpZy1vcHRpb24tbmFtZVwiPnNlcnZlci5obXIub3ZlcmxheTwvY29kZT4gdG8gPGNvZGUgcGFydD1cImNvbmZpZy1vcHRpb24tdmFsdWVcIj5mYWxzZTwvY29kZT4gaW4gPGNvZGUgcGFydD1cImNvbmZpZy1maWxlLW5hbWVcIj52aXRlLmNvbmZpZy5qcy48L2NvZGU+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC9kaXY+XG5gXG5cbmNvbnN0IGZpbGVSRSA9IC8oPzpbYS16QS1aXTpcXFxcfFxcLykuKj86XFxkKzpcXGQrL2dcbmNvbnN0IGNvZGVmcmFtZVJFID0gL14oPzo+P1xccytcXGQrXFxzK1xcfC4qfFxccytcXHxcXHMqXFxeLiopXFxyP1xcbi9nbVxuXG4vLyBBbGxvdyBgRXJyb3JPdmVybGF5YCB0byBleHRlbmQgYEhUTUxFbGVtZW50YCBldmVuIGluIGVudmlyb25tZW50cyB3aGVyZVxuLy8gYEhUTUxFbGVtZW50YCB3YXMgbm90IG9yaWdpbmFsbHkgZGVmaW5lZC5cbmNvbnN0IHsgSFRNTEVsZW1lbnQgPSBjbGFzcyB7fSBhcyB0eXBlb2YgZ2xvYmFsVGhpcy5IVE1MRWxlbWVudCB9ID0gZ2xvYmFsVGhpc1xuZXhwb3J0IGNsYXNzIEVycm9yT3ZlcmxheSBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgcm9vdDogU2hhZG93Um9vdFxuXG4gIGNvbnN0cnVjdG9yKGVycjogRXJyb3JQYXlsb2FkWydlcnInXSwgbGlua3MgPSB0cnVlKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMucm9vdCA9IHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pXG4gICAgdGhpcy5yb290LmlubmVySFRNTCA9IHRlbXBsYXRlXG5cbiAgICBjb2RlZnJhbWVSRS5sYXN0SW5kZXggPSAwXG4gICAgY29uc3QgaGFzRnJhbWUgPSBlcnIuZnJhbWUgJiYgY29kZWZyYW1lUkUudGVzdChlcnIuZnJhbWUpXG4gICAgY29uc3QgbWVzc2FnZSA9IGhhc0ZyYW1lXG4gICAgICA/IGVyci5tZXNzYWdlLnJlcGxhY2UoY29kZWZyYW1lUkUsICcnKVxuICAgICAgOiBlcnIubWVzc2FnZVxuICAgIGlmIChlcnIucGx1Z2luKSB7XG4gICAgICB0aGlzLnRleHQoJy5wbHVnaW4nLCBgW3BsdWdpbjoke2Vyci5wbHVnaW59XSBgKVxuICAgIH1cbiAgICB0aGlzLnRleHQoJy5tZXNzYWdlLWJvZHknLCBtZXNzYWdlLnRyaW0oKSlcblxuICAgIGNvbnN0IFtmaWxlXSA9IChlcnIubG9jPy5maWxlIHx8IGVyci5pZCB8fCAndW5rbm93biBmaWxlJykuc3BsaXQoYD9gKVxuICAgIGlmIChlcnIubG9jKSB7XG4gICAgICB0aGlzLnRleHQoJy5maWxlJywgYCR7ZmlsZX06JHtlcnIubG9jLmxpbmV9OiR7ZXJyLmxvYy5jb2x1bW59YCwgbGlua3MpXG4gICAgfSBlbHNlIGlmIChlcnIuaWQpIHtcbiAgICAgIHRoaXMudGV4dCgnLmZpbGUnLCBmaWxlKVxuICAgIH1cblxuICAgIGlmIChoYXNGcmFtZSkge1xuICAgICAgdGhpcy50ZXh0KCcuZnJhbWUnLCBlcnIuZnJhbWUhLnRyaW0oKSlcbiAgICB9XG4gICAgdGhpcy50ZXh0KCcuc3RhY2snLCBlcnIuc3RhY2ssIGxpbmtzKVxuXG4gICAgdGhpcy5yb290LnF1ZXJ5U2VsZWN0b3IoJy53aW5kb3cnKSEuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIH0pXG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIHRoaXMuY2xvc2UoKVxuICAgIH0pXG4gIH1cblxuICB0ZXh0KHNlbGVjdG9yOiBzdHJpbmcsIHRleHQ6IHN0cmluZywgbGlua0ZpbGVzID0gZmFsc2UpOiB2b2lkIHtcbiAgICBjb25zdCBlbCA9IHRoaXMucm9vdC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKSFcbiAgICBpZiAoIWxpbmtGaWxlcykge1xuICAgICAgZWwudGV4dENvbnRlbnQgPSB0ZXh0XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBjdXJJbmRleCA9IDBcbiAgICAgIGxldCBtYXRjaDogUmVnRXhwRXhlY0FycmF5IHwgbnVsbFxuICAgICAgZmlsZVJFLmxhc3RJbmRleCA9IDBcbiAgICAgIHdoaWxlICgobWF0Y2ggPSBmaWxlUkUuZXhlYyh0ZXh0KSkpIHtcbiAgICAgICAgY29uc3QgeyAwOiBmaWxlLCBpbmRleCB9ID0gbWF0Y2hcbiAgICAgICAgaWYgKGluZGV4ICE9IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBmcmFnID0gdGV4dC5zbGljZShjdXJJbmRleCwgaW5kZXgpXG4gICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZnJhZykpXG4gICAgICAgICAgY29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxuICAgICAgICAgIGxpbmsudGV4dENvbnRlbnQgPSBmaWxlXG4gICAgICAgICAgbGluay5jbGFzc05hbWUgPSAnZmlsZS1saW5rJ1xuICAgICAgICAgIGxpbmsub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgIGZldGNoKGAke2Jhc2V9X19vcGVuLWluLWVkaXRvcj9maWxlPWAgKyBlbmNvZGVVUklDb21wb25lbnQoZmlsZSkpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGxpbmspXG4gICAgICAgICAgY3VySW5kZXggKz0gZnJhZy5sZW5ndGggKyBmaWxlLmxlbmd0aFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5wYXJlbnROb2RlPy5yZW1vdmVDaGlsZCh0aGlzKVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBvdmVybGF5SWQgPSAndml0ZS1lcnJvci1vdmVybGF5J1xuY29uc3QgeyBjdXN0b21FbGVtZW50cyB9ID0gZ2xvYmFsVGhpcyAvLyBFbnN1cmUgYGN1c3RvbUVsZW1lbnRzYCBpcyBkZWZpbmVkIGJlZm9yZSB0aGUgbmV4dCBsaW5lLlxuaWYgKGN1c3RvbUVsZW1lbnRzICYmICFjdXN0b21FbGVtZW50cy5nZXQob3ZlcmxheUlkKSkge1xuICBjdXN0b21FbGVtZW50cy5kZWZpbmUob3ZlcmxheUlkLCBFcnJvck92ZXJsYXkpXG59XG4iLCJpbXBvcnQgdHlwZSB7IEVycm9yUGF5bG9hZCwgSE1SUGF5bG9hZCwgVXBkYXRlIH0gZnJvbSAndHlwZXMvaG1yUGF5bG9hZCdcbmltcG9ydCB0eXBlIHsgTW9kdWxlTmFtZXNwYWNlLCBWaXRlSG90Q29udGV4dCB9IGZyb20gJ3R5cGVzL2hvdCdcbmltcG9ydCB0eXBlIHsgSW5mZXJDdXN0b21FdmVudFBheWxvYWQgfSBmcm9tICd0eXBlcy9jdXN0b21FdmVudCdcbmltcG9ydCB7IEVycm9yT3ZlcmxheSwgb3ZlcmxheUlkIH0gZnJvbSAnLi9vdmVybGF5J1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vZGUvbm8tbWlzc2luZy1pbXBvcnRcbmltcG9ydCAnQHZpdGUvZW52J1xuXG4vLyBpbmplY3RlZCBieSB0aGUgaG1yIHBsdWdpbiB3aGVuIHNlcnZlZFxuZGVjbGFyZSBjb25zdCBfX0JBU0VfXzogc3RyaW5nXG5kZWNsYXJlIGNvbnN0IF9fU0VSVkVSX0hPU1RfXzogc3RyaW5nXG5kZWNsYXJlIGNvbnN0IF9fSE1SX1BST1RPQ09MX186IHN0cmluZyB8IG51bGxcbmRlY2xhcmUgY29uc3QgX19ITVJfSE9TVE5BTUVfXzogc3RyaW5nIHwgbnVsbFxuZGVjbGFyZSBjb25zdCBfX0hNUl9QT1JUX186IG51bWJlciB8IG51bGxcbmRlY2xhcmUgY29uc3QgX19ITVJfRElSRUNUX1RBUkdFVF9fOiBzdHJpbmdcbmRlY2xhcmUgY29uc3QgX19ITVJfQkFTRV9fOiBzdHJpbmdcbmRlY2xhcmUgY29uc3QgX19ITVJfVElNRU9VVF9fOiBudW1iZXJcbmRlY2xhcmUgY29uc3QgX19ITVJfRU5BQkxFX09WRVJMQVlfXzogYm9vbGVhblxuXG5jb25zb2xlLmRlYnVnKCdbdml0ZV0gY29ubmVjdGluZy4uLicpXG5cbmNvbnN0IGltcG9ydE1ldGFVcmwgPSBuZXcgVVJMKGltcG9ydC5tZXRhLnVybClcblxuLy8gdXNlIHNlcnZlciBjb25maWd1cmF0aW9uLCB0aGVuIGZhbGxiYWNrIHRvIGluZmVyZW5jZVxuY29uc3Qgc2VydmVySG9zdCA9IF9fU0VSVkVSX0hPU1RfX1xuY29uc3Qgc29ja2V0UHJvdG9jb2wgPVxuICBfX0hNUl9QUk9UT0NPTF9fIHx8IChpbXBvcnRNZXRhVXJsLnByb3RvY29sID09PSAnaHR0cHM6JyA/ICd3c3MnIDogJ3dzJylcbmNvbnN0IGhtclBvcnQgPSBfX0hNUl9QT1JUX19cbmNvbnN0IHNvY2tldEhvc3QgPSBgJHtfX0hNUl9IT1NUTkFNRV9fIHx8IGltcG9ydE1ldGFVcmwuaG9zdG5hbWV9OiR7XG4gIGhtclBvcnQgfHwgaW1wb3J0TWV0YVVybC5wb3J0XG59JHtfX0hNUl9CQVNFX199YFxuY29uc3QgZGlyZWN0U29ja2V0SG9zdCA9IF9fSE1SX0RJUkVDVF9UQVJHRVRfX1xuY29uc3QgYmFzZSA9IF9fQkFTRV9fIHx8ICcvJ1xuY29uc3QgbWVzc2FnZUJ1ZmZlcjogc3RyaW5nW10gPSBbXVxuXG5sZXQgc29ja2V0OiBXZWJTb2NrZXRcbnRyeSB7XG4gIGxldCBmYWxsYmFjazogKCgpID0+IHZvaWQpIHwgdW5kZWZpbmVkXG4gIC8vIG9ubHkgdXNlIGZhbGxiYWNrIHdoZW4gcG9ydCBpcyBpbmZlcnJlZCB0byBwcmV2ZW50IGNvbmZ1c2lvblxuICBpZiAoIWhtclBvcnQpIHtcbiAgICBmYWxsYmFjayA9ICgpID0+IHtcbiAgICAgIC8vIGZhbGxiYWNrIHRvIGNvbm5lY3RpbmcgZGlyZWN0bHkgdG8gdGhlIGhtciBzZXJ2ZXJcbiAgICAgIC8vIGZvciBzZXJ2ZXJzIHdoaWNoIGRvZXMgbm90IHN1cHBvcnQgcHJveHlpbmcgd2Vic29ja2V0XG4gICAgICBzb2NrZXQgPSBzZXR1cFdlYlNvY2tldChzb2NrZXRQcm90b2NvbCwgZGlyZWN0U29ja2V0SG9zdCwgKCkgPT4ge1xuICAgICAgICBjb25zdCBjdXJyZW50U2NyaXB0SG9zdFVSTCA9IG5ldyBVUkwoaW1wb3J0Lm1ldGEudXJsKVxuICAgICAgICBjb25zdCBjdXJyZW50U2NyaXB0SG9zdCA9XG4gICAgICAgICAgY3VycmVudFNjcmlwdEhvc3RVUkwuaG9zdCArXG4gICAgICAgICAgY3VycmVudFNjcmlwdEhvc3RVUkwucGF0aG5hbWUucmVwbGFjZSgvQHZpdGVcXC9jbGllbnQkLywgJycpXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgJ1t2aXRlXSBmYWlsZWQgdG8gY29ubmVjdCB0byB3ZWJzb2NrZXQuXFxuJyArXG4gICAgICAgICAgICAneW91ciBjdXJyZW50IHNldHVwOlxcbicgK1xuICAgICAgICAgICAgYCAgKGJyb3dzZXIpICR7Y3VycmVudFNjcmlwdEhvc3R9IDwtLVtIVFRQXS0tPiAke3NlcnZlckhvc3R9IChzZXJ2ZXIpXFxuYCArXG4gICAgICAgICAgICBgICAoYnJvd3NlcikgJHtzb2NrZXRIb3N0fSA8LS1bV2ViU29ja2V0IChmYWlsaW5nKV0tLT4gJHtkaXJlY3RTb2NrZXRIb3N0fSAoc2VydmVyKVxcbmAgK1xuICAgICAgICAgICAgJ0NoZWNrIG91dCB5b3VyIFZpdGUgLyBuZXR3b3JrIGNvbmZpZ3VyYXRpb24gYW5kIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvc2VydmVyLW9wdGlvbnMuaHRtbCNzZXJ2ZXItaG1yIC4nLFxuICAgICAgICApXG4gICAgICB9KVxuICAgICAgc29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICdvcGVuJyxcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUuaW5mbyhcbiAgICAgICAgICAgICdbdml0ZV0gRGlyZWN0IHdlYnNvY2tldCBjb25uZWN0aW9uIGZhbGxiYWNrLiBDaGVjayBvdXQgaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9zZXJ2ZXItb3B0aW9ucy5odG1sI3NlcnZlci1obXIgdG8gcmVtb3ZlIHRoZSBwcmV2aW91cyBjb25uZWN0aW9uIGVycm9yLicsXG4gICAgICAgICAgKVxuICAgICAgICB9LFxuICAgICAgICB7IG9uY2U6IHRydWUgfSxcbiAgICAgIClcbiAgICB9XG4gIH1cblxuICBzb2NrZXQgPSBzZXR1cFdlYlNvY2tldChzb2NrZXRQcm90b2NvbCwgc29ja2V0SG9zdCwgZmFsbGJhY2spXG59IGNhdGNoIChlcnJvcikge1xuICBjb25zb2xlLmVycm9yKGBbdml0ZV0gZmFpbGVkIHRvIGNvbm5lY3QgdG8gd2Vic29ja2V0ICgke2Vycm9yfSkuIGApXG59XG5cbmZ1bmN0aW9uIHNldHVwV2ViU29ja2V0KFxuICBwcm90b2NvbDogc3RyaW5nLFxuICBob3N0QW5kUGF0aDogc3RyaW5nLFxuICBvbkNsb3NlV2l0aG91dE9wZW4/OiAoKSA9PiB2b2lkLFxuKSB7XG4gIGNvbnN0IHNvY2tldCA9IG5ldyBXZWJTb2NrZXQoYCR7cHJvdG9jb2x9Oi8vJHtob3N0QW5kUGF0aH1gLCAndml0ZS1obXInKVxuICBsZXQgaXNPcGVuZWQgPSBmYWxzZVxuXG4gIHNvY2tldC5hZGRFdmVudExpc3RlbmVyKFxuICAgICdvcGVuJyxcbiAgICAoKSA9PiB7XG4gICAgICBpc09wZW5lZCA9IHRydWVcbiAgICB9LFxuICAgIHsgb25jZTogdHJ1ZSB9LFxuICApXG5cbiAgLy8gTGlzdGVuIGZvciBtZXNzYWdlc1xuICBzb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGFzeW5jICh7IGRhdGEgfSkgPT4ge1xuICAgIGhhbmRsZU1lc3NhZ2UoSlNPTi5wYXJzZShkYXRhKSlcbiAgfSlcblxuICAvLyBwaW5nIHNlcnZlclxuICBzb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcignY2xvc2UnLCBhc3luYyAoeyB3YXNDbGVhbiB9KSA9PiB7XG4gICAgaWYgKHdhc0NsZWFuKSByZXR1cm5cblxuICAgIGlmICghaXNPcGVuZWQgJiYgb25DbG9zZVdpdGhvdXRPcGVuKSB7XG4gICAgICBvbkNsb3NlV2l0aG91dE9wZW4oKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFt2aXRlXSBzZXJ2ZXIgY29ubmVjdGlvbiBsb3N0LiBwb2xsaW5nIGZvciByZXN0YXJ0Li4uYClcbiAgICBhd2FpdCB3YWl0Rm9yU3VjY2Vzc2Z1bFBpbmcocHJvdG9jb2wsIGhvc3RBbmRQYXRoKVxuICAgIGxvY2F0aW9uLnJlbG9hZCgpXG4gIH0pXG5cbiAgcmV0dXJuIHNvY2tldFxufVxuXG5mdW5jdGlvbiB3YXJuRmFpbGVkRmV0Y2goZXJyOiBFcnJvciwgcGF0aDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgaWYgKCFlcnIubWVzc2FnZS5tYXRjaCgnZmV0Y2gnKSkge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICB9XG4gIGNvbnNvbGUuZXJyb3IoXG4gICAgYFtobXJdIEZhaWxlZCB0byByZWxvYWQgJHtwYXRofS4gYCArXG4gICAgICBgVGhpcyBjb3VsZCBiZSBkdWUgdG8gc3ludGF4IGVycm9ycyBvciBpbXBvcnRpbmcgbm9uLWV4aXN0ZW50IGAgK1xuICAgICAgYG1vZHVsZXMuIChzZWUgZXJyb3JzIGFib3ZlKWAsXG4gIClcbn1cblxuZnVuY3Rpb24gY2xlYW5VcmwocGF0aG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwocGF0aG5hbWUsIGxvY2F0aW9uLnRvU3RyaW5nKCkpXG4gIHVybC5zZWFyY2hQYXJhbXMuZGVsZXRlKCdkaXJlY3QnKVxuICByZXR1cm4gdXJsLnBhdGhuYW1lICsgdXJsLnNlYXJjaFxufVxuXG5sZXQgaXNGaXJzdFVwZGF0ZSA9IHRydWVcbmNvbnN0IG91dGRhdGVkTGlua1RhZ3MgPSBuZXcgV2Vha1NldDxIVE1MTGlua0VsZW1lbnQ+KClcblxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShwYXlsb2FkOiBITVJQYXlsb2FkKSB7XG4gIHN3aXRjaCAocGF5bG9hZC50eXBlKSB7XG4gICAgY2FzZSAnY29ubmVjdGVkJzpcbiAgICAgIGNvbnNvbGUuZGVidWcoYFt2aXRlXSBjb25uZWN0ZWQuYClcbiAgICAgIHNlbmRNZXNzYWdlQnVmZmVyKClcbiAgICAgIC8vIHByb3h5KG5naW54LCBkb2NrZXIpIGhtciB3cyBtYXliZSBjYXVzZWQgdGltZW91dCxcbiAgICAgIC8vIHNvIHNlbmQgcGluZyBwYWNrYWdlIGxldCB3cyBrZWVwIGFsaXZlLlxuICAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBpZiAoc29ja2V0LnJlYWR5U3RhdGUgPT09IHNvY2tldC5PUEVOKSB7XG4gICAgICAgICAgc29ja2V0LnNlbmQoJ3tcInR5cGVcIjpcInBpbmdcIn0nKVxuICAgICAgICB9XG4gICAgICB9LCBfX0hNUl9USU1FT1VUX18pXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VwZGF0ZSc6XG4gICAgICBub3RpZnlMaXN0ZW5lcnMoJ3ZpdGU6YmVmb3JlVXBkYXRlJywgcGF5bG9hZClcbiAgICAgIC8vIGlmIHRoaXMgaXMgdGhlIGZpcnN0IHVwZGF0ZSBhbmQgdGhlcmUncyBhbHJlYWR5IGFuIGVycm9yIG92ZXJsYXksIGl0XG4gICAgICAvLyBtZWFucyB0aGUgcGFnZSBvcGVuZWQgd2l0aCBleGlzdGluZyBzZXJ2ZXIgY29tcGlsZSBlcnJvciBhbmQgdGhlIHdob2xlXG4gICAgICAvLyBtb2R1bGUgc2NyaXB0IGZhaWxlZCB0byBsb2FkIChzaW5jZSBvbmUgb2YgdGhlIG5lc3RlZCBpbXBvcnRzIGlzIDUwMCkuXG4gICAgICAvLyBpbiB0aGlzIGNhc2UgYSBub3JtYWwgdXBkYXRlIHdvbid0IHdvcmsgYW5kIGEgZnVsbCByZWxvYWQgaXMgbmVlZGVkLlxuICAgICAgaWYgKGlzRmlyc3RVcGRhdGUgJiYgaGFzRXJyb3JPdmVybGF5KCkpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpXG4gICAgICAgIHJldHVyblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2xlYXJFcnJvck92ZXJsYXkoKVxuICAgICAgICBpc0ZpcnN0VXBkYXRlID0gZmFsc2VcbiAgICAgIH1cbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICBwYXlsb2FkLnVwZGF0ZXMubWFwKGFzeW5jICh1cGRhdGUpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICAgICAgICBpZiAodXBkYXRlLnR5cGUgPT09ICdqcy11cGRhdGUnKSB7XG4gICAgICAgICAgICByZXR1cm4gcXVldWVVcGRhdGUoZmV0Y2hVcGRhdGUodXBkYXRlKSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBjc3MtdXBkYXRlXG4gICAgICAgICAgLy8gdGhpcyBpcyBvbmx5IHNlbnQgd2hlbiBhIGNzcyBmaWxlIHJlZmVyZW5jZWQgd2l0aCA8bGluaz4gaXMgdXBkYXRlZFxuICAgICAgICAgIGNvbnN0IHsgcGF0aCwgdGltZXN0YW1wIH0gPSB1cGRhdGVcbiAgICAgICAgICBjb25zdCBzZWFyY2hVcmwgPSBjbGVhblVybChwYXRoKVxuICAgICAgICAgIC8vIGNhbid0IHVzZSBxdWVyeVNlbGVjdG9yIHdpdGggYFtocmVmKj1dYCBoZXJlIHNpbmNlIHRoZSBsaW5rIG1heSBiZVxuICAgICAgICAgIC8vIHVzaW5nIHJlbGF0aXZlIHBhdGhzIHNvIHdlIG5lZWQgdG8gdXNlIGxpbmsuaHJlZiB0byBncmFiIHRoZSBmdWxsXG4gICAgICAgICAgLy8gVVJMIGZvciB0aGUgaW5jbHVkZSBjaGVjay5cbiAgICAgICAgICBjb25zdCBlbCA9IEFycmF5LmZyb20oXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxMaW5rRWxlbWVudD4oJ2xpbmsnKSxcbiAgICAgICAgICApLmZpbmQoXG4gICAgICAgICAgICAoZSkgPT5cbiAgICAgICAgICAgICAgIW91dGRhdGVkTGlua1RhZ3MuaGFzKGUpICYmIGNsZWFuVXJsKGUuaHJlZikuaW5jbHVkZXMoc2VhcmNoVXJsKSxcbiAgICAgICAgICApXG5cbiAgICAgICAgICBpZiAoIWVsKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBuZXdQYXRoID0gYCR7YmFzZX0ke3NlYXJjaFVybC5zbGljZSgxKX0ke1xuICAgICAgICAgICAgc2VhcmNoVXJsLmluY2x1ZGVzKCc/JykgPyAnJicgOiAnPydcbiAgICAgICAgICB9dD0ke3RpbWVzdGFtcH1gXG5cbiAgICAgICAgICAvLyByYXRoZXIgdGhhbiBzd2FwcGluZyB0aGUgaHJlZiBvbiB0aGUgZXhpc3RpbmcgdGFnLCB3ZSB3aWxsXG4gICAgICAgICAgLy8gY3JlYXRlIGEgbmV3IGxpbmsgdGFnLiBPbmNlIHRoZSBuZXcgc3R5bGVzaGVldCBoYXMgbG9hZGVkIHdlXG4gICAgICAgICAgLy8gd2lsbCByZW1vdmUgdGhlIGV4aXN0aW5nIGxpbmsgdGFnLiBUaGlzIHJlbW92ZXMgYSBGbGFzaCBPZlxuICAgICAgICAgIC8vIFVuc3R5bGVkIENvbnRlbnQgdGhhdCBjYW4gb2NjdXIgd2hlbiBzd2FwcGluZyBvdXQgdGhlIHRhZyBocmVmXG4gICAgICAgICAgLy8gZGlyZWN0bHksIGFzIHRoZSBuZXcgc3R5bGVzaGVldCBoYXMgbm90IHlldCBiZWVuIGxvYWRlZC5cbiAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld0xpbmtUYWcgPSBlbC5jbG9uZU5vZGUoKSBhcyBIVE1MTGlua0VsZW1lbnRcbiAgICAgICAgICAgIG5ld0xpbmtUYWcuaHJlZiA9IG5ldyBVUkwobmV3UGF0aCwgZWwuaHJlZikuaHJlZlxuICAgICAgICAgICAgY29uc3QgcmVtb3ZlT2xkRWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIGVsLnJlbW92ZSgpXG4gICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFt2aXRlXSBjc3MgaG90IHVwZGF0ZWQ6ICR7c2VhcmNoVXJsfWApXG4gICAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV3TGlua1RhZy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgcmVtb3ZlT2xkRWwpXG4gICAgICAgICAgICBuZXdMaW5rVGFnLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgcmVtb3ZlT2xkRWwpXG4gICAgICAgICAgICBvdXRkYXRlZExpbmtUYWdzLmFkZChlbClcbiAgICAgICAgICAgIGVsLmFmdGVyKG5ld0xpbmtUYWcpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgICBub3RpZnlMaXN0ZW5lcnMoJ3ZpdGU6YWZ0ZXJVcGRhdGUnLCBwYXlsb2FkKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdjdXN0b20nOiB7XG4gICAgICBub3RpZnlMaXN0ZW5lcnMocGF5bG9hZC5ldmVudCwgcGF5bG9hZC5kYXRhKVxuICAgICAgYnJlYWtcbiAgICB9XG4gICAgY2FzZSAnZnVsbC1yZWxvYWQnOlxuICAgICAgbm90aWZ5TGlzdGVuZXJzKCd2aXRlOmJlZm9yZUZ1bGxSZWxvYWQnLCBwYXlsb2FkKVxuICAgICAgaWYgKHBheWxvYWQucGF0aCAmJiBwYXlsb2FkLnBhdGguZW5kc1dpdGgoJy5odG1sJykpIHtcbiAgICAgICAgLy8gaWYgaHRtbCBmaWxlIGlzIGVkaXRlZCwgb25seSByZWxvYWQgdGhlIHBhZ2UgaWYgdGhlIGJyb3dzZXIgaXNcbiAgICAgICAgLy8gY3VycmVudGx5IG9uIHRoYXQgcGFnZS5cbiAgICAgICAgY29uc3QgcGFnZVBhdGggPSBkZWNvZGVVUkkobG9jYXRpb24ucGF0aG5hbWUpXG4gICAgICAgIGNvbnN0IHBheWxvYWRQYXRoID0gYmFzZSArIHBheWxvYWQucGF0aC5zbGljZSgxKVxuICAgICAgICBpZiAoXG4gICAgICAgICAgcGFnZVBhdGggPT09IHBheWxvYWRQYXRoIHx8XG4gICAgICAgICAgcGF5bG9hZC5wYXRoID09PSAnL2luZGV4Lmh0bWwnIHx8XG4gICAgICAgICAgKHBhZ2VQYXRoLmVuZHNXaXRoKCcvJykgJiYgcGFnZVBhdGggKyAnaW5kZXguaHRtbCcgPT09IHBheWxvYWRQYXRoKVxuICAgICAgICApIHtcbiAgICAgICAgICBsb2NhdGlvbi5yZWxvYWQoKVxuICAgICAgICB9XG4gICAgICAgIHJldHVyblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9jYXRpb24ucmVsb2FkKClcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSAncHJ1bmUnOlxuICAgICAgbm90aWZ5TGlzdGVuZXJzKCd2aXRlOmJlZm9yZVBydW5lJywgcGF5bG9hZClcbiAgICAgIC8vIEFmdGVyIGFuIEhNUiB1cGRhdGUsIHNvbWUgbW9kdWxlcyBhcmUgbm8gbG9uZ2VyIGltcG9ydGVkIG9uIHRoZSBwYWdlXG4gICAgICAvLyBidXQgdGhleSBtYXkgaGF2ZSBsZWZ0IGJlaGluZCBzaWRlIGVmZmVjdHMgdGhhdCBuZWVkIHRvIGJlIGNsZWFuZWQgdXBcbiAgICAgIC8vICguZS5nIHN0eWxlIGluamVjdGlvbnMpXG4gICAgICAvLyBUT0RPIFRyaWdnZXIgdGhlaXIgZGlzcG9zZSBjYWxsYmFja3MuXG4gICAgICBwYXlsb2FkLnBhdGhzLmZvckVhY2goKHBhdGgpID0+IHtcbiAgICAgICAgY29uc3QgZm4gPSBwcnVuZU1hcC5nZXQocGF0aClcbiAgICAgICAgaWYgKGZuKSB7XG4gICAgICAgICAgZm4oZGF0YU1hcC5nZXQocGF0aCkpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Vycm9yJzoge1xuICAgICAgbm90aWZ5TGlzdGVuZXJzKCd2aXRlOmVycm9yJywgcGF5bG9hZClcbiAgICAgIGNvbnN0IGVyciA9IHBheWxvYWQuZXJyXG4gICAgICBpZiAoZW5hYmxlT3ZlcmxheSkge1xuICAgICAgICBjcmVhdGVFcnJvck92ZXJsYXkoZXJyKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICBgW3ZpdGVdIEludGVybmFsIFNlcnZlciBFcnJvclxcbiR7ZXJyLm1lc3NhZ2V9XFxuJHtlcnIuc3RhY2t9YCxcbiAgICAgICAgKVxuICAgICAgfVxuICAgICAgYnJlYWtcbiAgICB9XG4gICAgZGVmYXVsdDoge1xuICAgICAgY29uc3QgY2hlY2s6IG5ldmVyID0gcGF5bG9hZFxuICAgICAgcmV0dXJuIGNoZWNrXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUxpc3RlbmVyczxUIGV4dGVuZHMgc3RyaW5nPihcbiAgZXZlbnQ6IFQsXG4gIGRhdGE6IEluZmVyQ3VzdG9tRXZlbnRQYXlsb2FkPFQ+LFxuKTogdm9pZFxuZnVuY3Rpb24gbm90aWZ5TGlzdGVuZXJzKGV2ZW50OiBzdHJpbmcsIGRhdGE6IGFueSk6IHZvaWQge1xuICBjb25zdCBjYnMgPSBjdXN0b21MaXN0ZW5lcnNNYXAuZ2V0KGV2ZW50KVxuICBpZiAoY2JzKSB7XG4gICAgY2JzLmZvckVhY2goKGNiKSA9PiBjYihkYXRhKSlcbiAgfVxufVxuXG5jb25zdCBlbmFibGVPdmVybGF5ID0gX19ITVJfRU5BQkxFX09WRVJMQVlfX1xuXG5mdW5jdGlvbiBjcmVhdGVFcnJvck92ZXJsYXkoZXJyOiBFcnJvclBheWxvYWRbJ2VyciddKSB7XG4gIGlmICghZW5hYmxlT3ZlcmxheSkgcmV0dXJuXG4gIGNsZWFyRXJyb3JPdmVybGF5KClcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChuZXcgRXJyb3JPdmVybGF5KGVycikpXG59XG5cbmZ1bmN0aW9uIGNsZWFyRXJyb3JPdmVybGF5KCkge1xuICBkb2N1bWVudFxuICAgIC5xdWVyeVNlbGVjdG9yQWxsKG92ZXJsYXlJZClcbiAgICAuZm9yRWFjaCgobikgPT4gKG4gYXMgRXJyb3JPdmVybGF5KS5jbG9zZSgpKVxufVxuXG5mdW5jdGlvbiBoYXNFcnJvck92ZXJsYXkoKSB7XG4gIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKG92ZXJsYXlJZCkubGVuZ3RoXG59XG5cbmxldCBwZW5kaW5nID0gZmFsc2VcbmxldCBxdWV1ZWQ6IFByb21pc2U8KCgpID0+IHZvaWQpIHwgdW5kZWZpbmVkPltdID0gW11cblxuLyoqXG4gKiBidWZmZXIgbXVsdGlwbGUgaG90IHVwZGF0ZXMgdHJpZ2dlcmVkIGJ5IHRoZSBzYW1lIHNyYyBjaGFuZ2VcbiAqIHNvIHRoYXQgdGhleSBhcmUgaW52b2tlZCBpbiB0aGUgc2FtZSBvcmRlciB0aGV5IHdlcmUgc2VudC5cbiAqIChvdGhlcndpc2UgdGhlIG9yZGVyIG1heSBiZSBpbmNvbnNpc3RlbnQgYmVjYXVzZSBvZiB0aGUgaHR0cCByZXF1ZXN0IHJvdW5kIHRyaXApXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHF1ZXVlVXBkYXRlKHA6IFByb21pc2U8KCgpID0+IHZvaWQpIHwgdW5kZWZpbmVkPikge1xuICBxdWV1ZWQucHVzaChwKVxuICBpZiAoIXBlbmRpbmcpIHtcbiAgICBwZW5kaW5nID0gdHJ1ZVxuICAgIGF3YWl0IFByb21pc2UucmVzb2x2ZSgpXG4gICAgcGVuZGluZyA9IGZhbHNlXG4gICAgY29uc3QgbG9hZGluZyA9IFsuLi5xdWV1ZWRdXG4gICAgcXVldWVkID0gW11cbiAgICA7KGF3YWl0IFByb21pc2UuYWxsKGxvYWRpbmcpKS5mb3JFYWNoKChmbikgPT4gZm4gJiYgZm4oKSlcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiB3YWl0Rm9yU3VjY2Vzc2Z1bFBpbmcoXG4gIHNvY2tldFByb3RvY29sOiBzdHJpbmcsXG4gIGhvc3RBbmRQYXRoOiBzdHJpbmcsXG4gIG1zID0gMTAwMCxcbikge1xuICBjb25zdCBwaW5nSG9zdFByb3RvY29sID0gc29ja2V0UHJvdG9jb2wgPT09ICd3c3MnID8gJ2h0dHBzJyA6ICdodHRwJ1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zdGFudC1jb25kaXRpb25cbiAgd2hpbGUgKHRydWUpIHtcbiAgICB0cnkge1xuICAgICAgLy8gQSBmZXRjaCBvbiBhIHdlYnNvY2tldCBVUkwgd2lsbCByZXR1cm4gYSBzdWNjZXNzZnVsIHByb21pc2Ugd2l0aCBzdGF0dXMgNDAwLFxuICAgICAgLy8gYnV0IHdpbGwgcmVqZWN0IGEgbmV0d29ya2luZyBlcnJvci5cbiAgICAgIC8vIFdoZW4gcnVubmluZyBvbiBtaWRkbGV3YXJlIG1vZGUsIGl0IHJldHVybnMgc3RhdHVzIDQyNiwgYW5kIGFuIGNvcnMgZXJyb3IgaGFwcGVucyBpZiBtb2RlIGlzIG5vdCBuby1jb3JzXG4gICAgICBhd2FpdCBmZXRjaChgJHtwaW5nSG9zdFByb3RvY29sfTovLyR7aG9zdEFuZFBhdGh9YCwge1xuICAgICAgICBtb2RlOiAnbm8tY29ycycsXG4gICAgICB9KVxuICAgICAgYnJlYWtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyB3YWl0IG1zIGJlZm9yZSBhdHRlbXB0aW5nIHRvIHBpbmcgYWdhaW5cbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSlcbiAgICB9XG4gIH1cbn1cblxuY29uc3Qgc2hlZXRzTWFwID0gbmV3IE1hcDxzdHJpbmcsIEhUTUxTdHlsZUVsZW1lbnQ+KClcbi8vIGFsbCBjc3MgaW1wb3J0cyBzaG91bGQgYmUgaW5zZXJ0ZWQgYXQgdGhlIHNhbWUgcG9zaXRpb25cbi8vIGJlY2F1c2UgYWZ0ZXIgYnVpbGQgaXQgd2lsbCBiZSBhIHNpbmdsZSBjc3MgZmlsZVxubGV0IGxhc3RJbnNlcnRlZFN0eWxlOiBIVE1MU3R5bGVFbGVtZW50IHwgdW5kZWZpbmVkXG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVTdHlsZShpZDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiB2b2lkIHtcbiAgbGV0IHN0eWxlID0gc2hlZXRzTWFwLmdldChpZClcbiAgaWYgKCFzdHlsZSkge1xuICAgIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAgIHN0eWxlLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpXG4gICAgc3R5bGUuc2V0QXR0cmlidXRlKCdkYXRhLXZpdGUtZGV2LWlkJywgaWQpXG4gICAgc3R5bGUudGV4dENvbnRlbnQgPSBjb250ZW50XG5cbiAgICBpZiAoIWxhc3RJbnNlcnRlZFN0eWxlKSB7XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKVxuXG4gICAgICAvLyByZXNldCBsYXN0SW5zZXJ0ZWRTdHlsZSBhZnRlciBhc3luY1xuICAgICAgLy8gYmVjYXVzZSBkeW5hbWljYWxseSBpbXBvcnRlZCBjc3Mgd2lsbCBiZSBzcGxpdHRlZCBpbnRvIGEgZGlmZmVyZW50IGZpbGVcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBsYXN0SW5zZXJ0ZWRTdHlsZSA9IHVuZGVmaW5lZFxuICAgICAgfSwgMClcbiAgICB9IGVsc2Uge1xuICAgICAgbGFzdEluc2VydGVkU3R5bGUuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KCdhZnRlcmVuZCcsIHN0eWxlKVxuICAgIH1cbiAgICBsYXN0SW5zZXJ0ZWRTdHlsZSA9IHN0eWxlXG4gIH0gZWxzZSB7XG4gICAgc3R5bGUudGV4dENvbnRlbnQgPSBjb250ZW50XG4gIH1cbiAgc2hlZXRzTWFwLnNldChpZCwgc3R5bGUpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVTdHlsZShpZDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHN0eWxlID0gc2hlZXRzTWFwLmdldChpZClcbiAgaWYgKHN0eWxlKSB7XG4gICAgZG9jdW1lbnQuaGVhZC5yZW1vdmVDaGlsZChzdHlsZSlcbiAgICBzaGVldHNNYXAuZGVsZXRlKGlkKVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoVXBkYXRlKHtcbiAgcGF0aCxcbiAgYWNjZXB0ZWRQYXRoLFxuICB0aW1lc3RhbXAsXG4gIGV4cGxpY2l0SW1wb3J0UmVxdWlyZWQsXG59OiBVcGRhdGUpIHtcbiAgY29uc3QgbW9kID0gaG90TW9kdWxlc01hcC5nZXQocGF0aClcbiAgaWYgKCFtb2QpIHtcbiAgICAvLyBJbiBhIGNvZGUtc3BsaXR0aW5nIHByb2plY3QsXG4gICAgLy8gaXQgaXMgY29tbW9uIHRoYXQgdGhlIGhvdC11cGRhdGluZyBtb2R1bGUgaXMgbm90IGxvYWRlZCB5ZXQuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3ZpdGVqcy92aXRlL2lzc3Vlcy83MjFcbiAgICByZXR1cm5cbiAgfVxuXG4gIGxldCBmZXRjaGVkTW9kdWxlOiBNb2R1bGVOYW1lc3BhY2UgfCB1bmRlZmluZWRcbiAgY29uc3QgaXNTZWxmVXBkYXRlID0gcGF0aCA9PT0gYWNjZXB0ZWRQYXRoXG5cbiAgLy8gZGV0ZXJtaW5lIHRoZSBxdWFsaWZpZWQgY2FsbGJhY2tzIGJlZm9yZSB3ZSByZS1pbXBvcnQgdGhlIG1vZHVsZXNcbiAgY29uc3QgcXVhbGlmaWVkQ2FsbGJhY2tzID0gbW9kLmNhbGxiYWNrcy5maWx0ZXIoKHsgZGVwcyB9KSA9PlxuICAgIGRlcHMuaW5jbHVkZXMoYWNjZXB0ZWRQYXRoKSxcbiAgKVxuXG4gIGlmIChpc1NlbGZVcGRhdGUgfHwgcXVhbGlmaWVkQ2FsbGJhY2tzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBkaXNwb3NlciA9IGRpc3Bvc2VNYXAuZ2V0KGFjY2VwdGVkUGF0aClcbiAgICBpZiAoZGlzcG9zZXIpIGF3YWl0IGRpc3Bvc2VyKGRhdGFNYXAuZ2V0KGFjY2VwdGVkUGF0aCkpXG4gICAgY29uc3QgW2FjY2VwdGVkUGF0aFdpdGhvdXRRdWVyeSwgcXVlcnldID0gYWNjZXB0ZWRQYXRoLnNwbGl0KGA/YClcbiAgICB0cnkge1xuICAgICAgZmV0Y2hlZE1vZHVsZSA9IGF3YWl0IGltcG9ydChcbiAgICAgICAgLyogQHZpdGUtaWdub3JlICovXG4gICAgICAgIGJhc2UgK1xuICAgICAgICAgIGFjY2VwdGVkUGF0aFdpdGhvdXRRdWVyeS5zbGljZSgxKSArXG4gICAgICAgICAgYD8ke2V4cGxpY2l0SW1wb3J0UmVxdWlyZWQgPyAnaW1wb3J0JicgOiAnJ310PSR7dGltZXN0YW1wfSR7XG4gICAgICAgICAgICBxdWVyeSA/IGAmJHtxdWVyeX1gIDogJydcbiAgICAgICAgICB9YFxuICAgICAgKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHdhcm5GYWlsZWRGZXRjaChlLCBhY2NlcHRlZFBhdGgpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBmb3IgKGNvbnN0IHsgZGVwcywgZm4gfSBvZiBxdWFsaWZpZWRDYWxsYmFja3MpIHtcbiAgICAgIGZuKGRlcHMubWFwKChkZXApID0+IChkZXAgPT09IGFjY2VwdGVkUGF0aCA/IGZldGNoZWRNb2R1bGUgOiB1bmRlZmluZWQpKSlcbiAgICB9XG4gICAgY29uc3QgbG9nZ2VkUGF0aCA9IGlzU2VsZlVwZGF0ZSA/IHBhdGggOiBgJHthY2NlcHRlZFBhdGh9IHZpYSAke3BhdGh9YFxuICAgIGNvbnNvbGUuZGVidWcoYFt2aXRlXSBob3QgdXBkYXRlZDogJHtsb2dnZWRQYXRofWApXG4gIH1cbn1cblxuZnVuY3Rpb24gc2VuZE1lc3NhZ2VCdWZmZXIoKSB7XG4gIGlmIChzb2NrZXQucmVhZHlTdGF0ZSA9PT0gMSkge1xuICAgIG1lc3NhZ2VCdWZmZXIuZm9yRWFjaCgobXNnKSA9PiBzb2NrZXQuc2VuZChtc2cpKVxuICAgIG1lc3NhZ2VCdWZmZXIubGVuZ3RoID0gMFxuICB9XG59XG5cbmludGVyZmFjZSBIb3RNb2R1bGUge1xuICBpZDogc3RyaW5nXG4gIGNhbGxiYWNrczogSG90Q2FsbGJhY2tbXVxufVxuXG5pbnRlcmZhY2UgSG90Q2FsbGJhY2sge1xuICAvLyB0aGUgZGVwZW5kZW5jaWVzIG11c3QgYmUgZmV0Y2hhYmxlIHBhdGhzXG4gIGRlcHM6IHN0cmluZ1tdXG4gIGZuOiAobW9kdWxlczogQXJyYXk8TW9kdWxlTmFtZXNwYWNlIHwgdW5kZWZpbmVkPikgPT4gdm9pZFxufVxuXG50eXBlIEN1c3RvbUxpc3RlbmVyc01hcCA9IE1hcDxzdHJpbmcsICgoZGF0YTogYW55KSA9PiB2b2lkKVtdPlxuXG5jb25zdCBob3RNb2R1bGVzTWFwID0gbmV3IE1hcDxzdHJpbmcsIEhvdE1vZHVsZT4oKVxuY29uc3QgZGlzcG9zZU1hcCA9IG5ldyBNYXA8c3RyaW5nLCAoZGF0YTogYW55KSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPj4oKVxuY29uc3QgcHJ1bmVNYXAgPSBuZXcgTWFwPHN0cmluZywgKGRhdGE6IGFueSkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD4+KClcbmNvbnN0IGRhdGFNYXAgPSBuZXcgTWFwPHN0cmluZywgYW55PigpXG5jb25zdCBjdXN0b21MaXN0ZW5lcnNNYXA6IEN1c3RvbUxpc3RlbmVyc01hcCA9IG5ldyBNYXAoKVxuY29uc3QgY3R4VG9MaXN0ZW5lcnNNYXAgPSBuZXcgTWFwPHN0cmluZywgQ3VzdG9tTGlzdGVuZXJzTWFwPigpXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVIb3RDb250ZXh0KG93bmVyUGF0aDogc3RyaW5nKTogVml0ZUhvdENvbnRleHQge1xuICBpZiAoIWRhdGFNYXAuaGFzKG93bmVyUGF0aCkpIHtcbiAgICBkYXRhTWFwLnNldChvd25lclBhdGgsIHt9KVxuICB9XG5cbiAgLy8gd2hlbiBhIGZpbGUgaXMgaG90IHVwZGF0ZWQsIGEgbmV3IGNvbnRleHQgaXMgY3JlYXRlZFxuICAvLyBjbGVhciBpdHMgc3RhbGUgY2FsbGJhY2tzXG4gIGNvbnN0IG1vZCA9IGhvdE1vZHVsZXNNYXAuZ2V0KG93bmVyUGF0aClcbiAgaWYgKG1vZCkge1xuICAgIG1vZC5jYWxsYmFja3MgPSBbXVxuICB9XG5cbiAgLy8gY2xlYXIgc3RhbGUgY3VzdG9tIGV2ZW50IGxpc3RlbmVyc1xuICBjb25zdCBzdGFsZUxpc3RlbmVycyA9IGN0eFRvTGlzdGVuZXJzTWFwLmdldChvd25lclBhdGgpXG4gIGlmIChzdGFsZUxpc3RlbmVycykge1xuICAgIGZvciAoY29uc3QgW2V2ZW50LCBzdGFsZUZuc10gb2Ygc3RhbGVMaXN0ZW5lcnMpIHtcbiAgICAgIGNvbnN0IGxpc3RlbmVycyA9IGN1c3RvbUxpc3RlbmVyc01hcC5nZXQoZXZlbnQpXG4gICAgICBpZiAobGlzdGVuZXJzKSB7XG4gICAgICAgIGN1c3RvbUxpc3RlbmVyc01hcC5zZXQoXG4gICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgbGlzdGVuZXJzLmZpbHRlcigobCkgPT4gIXN0YWxlRm5zLmluY2x1ZGVzKGwpKSxcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG5ld0xpc3RlbmVyczogQ3VzdG9tTGlzdGVuZXJzTWFwID0gbmV3IE1hcCgpXG4gIGN0eFRvTGlzdGVuZXJzTWFwLnNldChvd25lclBhdGgsIG5ld0xpc3RlbmVycylcblxuICBmdW5jdGlvbiBhY2NlcHREZXBzKGRlcHM6IHN0cmluZ1tdLCBjYWxsYmFjazogSG90Q2FsbGJhY2tbJ2ZuJ10gPSAoKSA9PiB7fSkge1xuICAgIGNvbnN0IG1vZDogSG90TW9kdWxlID0gaG90TW9kdWxlc01hcC5nZXQob3duZXJQYXRoKSB8fCB7XG4gICAgICBpZDogb3duZXJQYXRoLFxuICAgICAgY2FsbGJhY2tzOiBbXSxcbiAgICB9XG4gICAgbW9kLmNhbGxiYWNrcy5wdXNoKHtcbiAgICAgIGRlcHMsXG4gICAgICBmbjogY2FsbGJhY2ssXG4gICAgfSlcbiAgICBob3RNb2R1bGVzTWFwLnNldChvd25lclBhdGgsIG1vZClcbiAgfVxuXG4gIGNvbnN0IGhvdDogVml0ZUhvdENvbnRleHQgPSB7XG4gICAgZ2V0IGRhdGEoKSB7XG4gICAgICByZXR1cm4gZGF0YU1hcC5nZXQob3duZXJQYXRoKVxuICAgIH0sXG5cbiAgICBhY2NlcHQoZGVwcz86IGFueSwgY2FsbGJhY2s/OiBhbnkpIHtcbiAgICAgIGlmICh0eXBlb2YgZGVwcyA9PT0gJ2Z1bmN0aW9uJyB8fCAhZGVwcykge1xuICAgICAgICAvLyBzZWxmLWFjY2VwdDogaG90LmFjY2VwdCgoKSA9PiB7fSlcbiAgICAgICAgYWNjZXB0RGVwcyhbb3duZXJQYXRoXSwgKFttb2RdKSA9PiBkZXBzPy4obW9kKSlcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlcHMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIGV4cGxpY2l0IGRlcHNcbiAgICAgICAgYWNjZXB0RGVwcyhbZGVwc10sIChbbW9kXSkgPT4gY2FsbGJhY2s/Lihtb2QpKVxuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRlcHMpKSB7XG4gICAgICAgIGFjY2VwdERlcHMoZGVwcywgY2FsbGJhY2spXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgaG90LmFjY2VwdCgpIHVzYWdlLmApXG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIGV4cG9ydCBuYW1lcyAoZmlyc3QgYXJnKSBhcmUgaXJyZWxldmFudCBvbiB0aGUgY2xpZW50IHNpZGUsIHRoZXkncmVcbiAgICAvLyBleHRyYWN0ZWQgaW4gdGhlIHNlcnZlciBmb3IgcHJvcGFnYXRpb25cbiAgICBhY2NlcHRFeHBvcnRzKF8sIGNhbGxiYWNrKSB7XG4gICAgICBhY2NlcHREZXBzKFtvd25lclBhdGhdLCAoW21vZF0pID0+IGNhbGxiYWNrPy4obW9kKSlcbiAgICB9LFxuXG4gICAgZGlzcG9zZShjYikge1xuICAgICAgZGlzcG9zZU1hcC5zZXQob3duZXJQYXRoLCBjYilcbiAgICB9LFxuXG4gICAgcHJ1bmUoY2IpIHtcbiAgICAgIHBydW5lTWFwLnNldChvd25lclBhdGgsIGNiKVxuICAgIH0sXG5cbiAgICAvLyBLZXB0IGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5ICgjMTEwMzYpXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciB1bnR5cGVkXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1mdW5jdGlvblxuICAgIGRlY2xpbmUoKSB7fSxcblxuICAgIC8vIHRlbGwgdGhlIHNlcnZlciB0byByZS1wZXJmb3JtIGhtciBwcm9wYWdhdGlvbiBmcm9tIHRoaXMgbW9kdWxlIGFzIHJvb3RcbiAgICBpbnZhbGlkYXRlKG1lc3NhZ2UpIHtcbiAgICAgIG5vdGlmeUxpc3RlbmVycygndml0ZTppbnZhbGlkYXRlJywgeyBwYXRoOiBvd25lclBhdGgsIG1lc3NhZ2UgfSlcbiAgICAgIHRoaXMuc2VuZCgndml0ZTppbnZhbGlkYXRlJywgeyBwYXRoOiBvd25lclBhdGgsIG1lc3NhZ2UgfSlcbiAgICAgIGNvbnNvbGUuZGVidWcoXG4gICAgICAgIGBbdml0ZV0gaW52YWxpZGF0ZSAke293bmVyUGF0aH0ke21lc3NhZ2UgPyBgOiAke21lc3NhZ2V9YCA6ICcnfWAsXG4gICAgICApXG4gICAgfSxcblxuICAgIC8vIGN1c3RvbSBldmVudHNcbiAgICBvbihldmVudCwgY2IpIHtcbiAgICAgIGNvbnN0IGFkZFRvTWFwID0gKG1hcDogTWFwPHN0cmluZywgYW55W10+KSA9PiB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gbWFwLmdldChldmVudCkgfHwgW11cbiAgICAgICAgZXhpc3RpbmcucHVzaChjYilcbiAgICAgICAgbWFwLnNldChldmVudCwgZXhpc3RpbmcpXG4gICAgICB9XG4gICAgICBhZGRUb01hcChjdXN0b21MaXN0ZW5lcnNNYXApXG4gICAgICBhZGRUb01hcChuZXdMaXN0ZW5lcnMpXG4gICAgfSxcblxuICAgIHNlbmQoZXZlbnQsIGRhdGEpIHtcbiAgICAgIG1lc3NhZ2VCdWZmZXIucHVzaChKU09OLnN0cmluZ2lmeSh7IHR5cGU6ICdjdXN0b20nLCBldmVudCwgZGF0YSB9KSlcbiAgICAgIHNlbmRNZXNzYWdlQnVmZmVyKClcbiAgICB9LFxuICB9XG5cbiAgcmV0dXJuIGhvdFxufVxuXG4vKipcbiAqIHVybHMgaGVyZSBhcmUgZHluYW1pYyBpbXBvcnQoKSB1cmxzIHRoYXQgY291bGRuJ3QgYmUgc3RhdGljYWxseSBhbmFseXplZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0UXVlcnkodXJsOiBzdHJpbmcsIHF1ZXJ5VG9JbmplY3Q6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIHNraXAgdXJscyB0aGF0IHdvbid0IGJlIGhhbmRsZWQgYnkgdml0ZVxuICBpZiAoIXVybC5zdGFydHNXaXRoKCcuJykgJiYgIXVybC5zdGFydHNXaXRoKCcvJykpIHtcbiAgICByZXR1cm4gdXJsXG4gIH1cblxuICAvLyBjYW4ndCB1c2UgcGF0aG5hbWUgZnJvbSBVUkwgc2luY2UgaXQgbWF5IGJlIHJlbGF0aXZlIGxpa2UgLi4vXG4gIGNvbnN0IHBhdGhuYW1lID0gdXJsLnJlcGxhY2UoLyMuKiQvLCAnJykucmVwbGFjZSgvXFw/LiokLywgJycpXG4gIGNvbnN0IHsgc2VhcmNoLCBoYXNoIH0gPSBuZXcgVVJMKHVybCwgJ2h0dHA6Ly92aXRlanMuZGV2JylcblxuICByZXR1cm4gYCR7cGF0aG5hbWV9PyR7cXVlcnlUb0luamVjdH0ke3NlYXJjaCA/IGAmYCArIHNlYXJjaC5zbGljZSgxKSA6ICcnfSR7XG4gICAgaGFzaCB8fCAnJ1xuICB9YFxufVxuXG5leHBvcnQgeyBFcnJvck92ZXJsYXkgfVxuIl0sIm5hbWVzIjpbImJhc2UiXSwibWFwcGluZ3MiOiI7O0FBS0EsTUFBTUEsTUFBSSxHQUFHLFFBQVEsSUFBSSxHQUFHLENBQUE7QUFFNUI7QUFDQSxNQUFNLFFBQVEsWUFBWSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNEh6QixDQUFBO0FBRUQsTUFBTSxNQUFNLEdBQUcsZ0NBQWdDLENBQUE7QUFDL0MsTUFBTSxXQUFXLEdBQUcsMENBQTBDLENBQUE7QUFFOUQ7QUFDQTtBQUNBLE1BQU0sRUFBRSxXQUFXLEdBQUcsTUFBQTtDQUF5QyxFQUFFLEdBQUcsVUFBVSxDQUFBO0FBQ3hFLE1BQU8sWUFBYSxTQUFRLFdBQVcsQ0FBQTtBQUczQyxJQUFBLFdBQUEsQ0FBWSxHQUF3QixFQUFFLEtBQUssR0FBRyxJQUFJLEVBQUE7O0FBQ2hELFFBQUEsS0FBSyxF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QUUsQ0FDakUsQ0FBQTtTQUNGOztRQUdELEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFBO0FBQ1YsWUFBQSxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQXVCLEtBQUk7Z0JBQzNDLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ3JDLGdCQUFBLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7QUFDakIsZ0JBQUEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUE7QUFDMUIsYUFBQyxDQUFBO1lBQ0QsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUE7WUFDNUIsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFBO1NBQ3ZCO1FBRUQsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUE7QUFDZCxZQUFBLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUNuRSxZQUFBLGlCQUFpQixFQUFFLENBQUE7U0FDcEI7S0FDRixDQUFBO0FBRUQsSUFBQSxPQUFPLEdBQUcsQ0FBQTtBQUNaLENBQUM7QUFFRDs7QUFFRztBQUNhLFNBQUEsV0FBVyxDQUFDLEdBQVcsRUFBRSxhQUFxQixFQUFBOztBQUU1RCxJQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUNoRCxRQUFBLE9BQU8sR0FBRyxDQUFBO0FBQ1gsS0FBQTs7QUFHRCxJQUFBLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDN0QsSUFBQSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxtQkFBbUIsQ0FBQyxDQUFBO0lBRTFELE9BQU8sQ0FBQSxFQUFHLFFBQVEsQ0FBQSxDQUFBLEVBQUksYUFBYSxDQUFBLEVBQUcsTUFBTSxHQUFHLENBQUcsQ0FBQSxDQUFBLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUEsRUFDdkUsSUFBSSxJQUFJLEVBQ1YsQ0FBQSxDQUFFLENBQUE7QUFDSjs7OzsiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxXX0=