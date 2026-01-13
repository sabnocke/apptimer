// Tauri doesn't have a Node.js server to do proper SSR
// so we use adapter-static with a fallback to index.html to put the site in SPA mode
// See: https://svelte.dev/docs/kit/single-page-apps
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
import {invoke} from "@tauri-apps/api/core";

export const ssr = false;
export const prerender = true;

import {getCurrentWindow} from "@tauri-apps/api/window";

if (typeof window !== "undefined") {
    const observer = window.ResizeObserver;
    window.ResizeObserver = class extends observer {
        constructor(callback: any) {
            super((entries, observer) => {
                window.requestAnimationFrame(() => {
                    callback(entries, observer);
                })
            });
        }
    }
}
