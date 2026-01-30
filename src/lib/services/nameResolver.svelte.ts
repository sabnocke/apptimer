import {BaseDirectory, exists, mkdir, readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";
import {Box, SuperMap} from "$lib/types";
import type {LogEntry} from "$lib/services/dataProvider.svelte";
import {getSteamGameName, loadAppDictionary, updateDisplayName} from "$lib/services/ipc";
import type {AppDictionary} from "$lib/types";
import {isSystemNoise} from "$lib/types";

class NameResolver {
    private _locationExists: boolean = false;
    private _mappingExists: boolean = false;
    mapping: SuperMap<string, AppDictionary> = new SuperMap();

    readonly cleanupRules = [
        {pattern: /-stable$/i, replace: ""},
        {pattern: /.exe$/i, replace: ""},
        // Result: org.kde.dolphin -> dolphin | org.gnome.gedit -> gedit
        {pattern: /^org\.[^.]+\.(.+)$/i, replace: "$1"},
        // Result: com.google.Chrome -> Chrome
        {pattern: /^com\.[^.]+\.(.+)$/i, replace: "$1"},
        //TODO maybe some other way of doing this
        {pattern: /^jetbrains-(.+)$/i, replace: "$1"},
    ]

    get mappingExists(): boolean {
        return this._mappingExists;
    }

    get locationExists(): boolean {
        return this._locationExists;
    }

    constructor() {
        this.load().then();
    }

    private async load(): Promise<void> {
        const src = await loadAppDictionary();
        const dict = new SuperMap<string, AppDictionary>();
        for (const item of src) {
            dict.set(item.processKey, item);
        }
        this.mapping = dict;
    }

    private async resolveGameNameInBackground(id: string) {
        return await getSteamGameName(parseInt(id, 10))
    }

    resolveSteamGameName(item: string): Box<string, undefined> {
        // item is "steam_app_<number>"
        const match = item.match(/steam_app_(\d+)/);
        if (match) {
            const appId = match[1];
            let resolvedName = this.mapping.fetch(appId).mapLeft(b => b.displayName);
            if(!resolvedName.hasContent || resolvedName.isInElse) {
                this.resolveGameNameInBackground(appId)
                    .then(resolvedName.bindLeft)
                    .catch(e => resolvedName.bindLeft(`Steam Game ${appId}`));
            }
            return resolvedName
        }
        return Box.else(undefined);
    }

    async storeDisplayName(processKey: string, newDisplayName: string): Promise<boolean> /*?maybe*/ {
        const r = this.mapping.modify(processKey, item => {
            item.displayName = newDisplayName;
            return item;
        });

        if (r) return r;

        return await updateDisplayName(processKey, newDisplayName);
    }

    capitalize(word: string): string {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    resolveComplex(item: LogEntry<Date>): string {
        if (!item.process_name && !item.window_title) {
            return "UNKNOWN"
        }

        if (isSystemNoise(item.process_name)) {
            return "Idle/System";
        }

        // PWA check regex
        if (/^[a-z]+-[a-z]{32}-.+$/.test(item.process_name)) {
            console.log("[DETECTED PWA pattern]");
            // window title can be: <program name> - <something>, I should remove both the colon and something
            const maybeName = item.window_title.split("-"); //? there can be more than two
            console.log("[SPLIT]:", maybeName);
            const someName = maybeName[0].replace(/\s/, "");
            console.log("[REPLACE]:", someName);
            return this.capitalize(someName);
        }

        if (/steam_app_\d+/.test(item.process_name)) {
            const val = this.resolveSteamGameName(item.process_name);
            //? Maybe the window title has some useful information
            console.log(`For ${item.process_name} exists window title: ${item.window_title}`);
            if (val.isOk) return val.unwrapOk();
        }

        const vb = this.mapping
            .fetch(item.process_name)
            .mapLeft(b => b.displayName)
            .unwrapOr("");
        if (vb !== "") return vb;

        let newName: string = item.process_name;
        for (const rule of this.cleanupRules) {
            if(!rule.pattern.test(newName)) continue;
            newName = item.process_name.replace(rule.pattern, rule.replace);
        }

        return this.capitalize((newName));
    }

    resolve(name: string): string {
        if (!name) return "Unknown";

        //1. find if mapping exists
        const vb = this.mapping
            .fetch(name)
            .mapLeft(b => b.displayName)
            .unwrapOr("");
        if (vb !== "") return vb;

        //2. if a rule exists for it
        let newName = name;
        for (const rule of this.cleanupRules) {
            if (!rule.pattern.test(newName)) continue;
            newName = name.replace(rule.pattern, rule.replace);
            // console.log("replace", rule.pattern, newName);
        }

        return this.capitalize(newName);
    }
}

export const resolver = new NameResolver();