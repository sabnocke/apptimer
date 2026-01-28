import {BaseDirectory, exists, mkdir, readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";
import {Box, SuperMap} from "$lib/types";
import type {LogEntry} from "$lib/services/dataProvider.svelte";

class NameResolver {
    private _locationExists: boolean = false;
    private _mappingExists: boolean = false;
    mapping: SuperMap<string, string> = new SuperMap();

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
        this.load().then(b => {
            b.actionRight(e => console.error(e));
        });
    }

    private async load(): Promise<Box<boolean, unknown>> {
        try {
            if (!await exists("", {baseDir: BaseDirectory.AppConfig})) {
                await mkdir("", {baseDir: BaseDirectory.AppConfig});
                this._locationExists = true;
            }
            if (!await exists("mapping.json", {baseDir: BaseDirectory.AppConfig})) {
                await writeTextFile("mapping.json", "{}", {baseDir: BaseDirectory.AppConfig});
                this._mappingExists = true;
            }

            const contents = await readTextFile("mapping.json", {baseDir: BaseDirectory.AppConfig});
            const userMap = JSON.parse(contents);

            Object.entries(userMap).forEach(([key, val]) => {
                this.mapping.set(key.toLowerCase(), String(val));
            });

            return Box.ok(true);
        } catch (e) {
            console.log(e);
            return Box.error(e);
        }
    }

    private async resolveGameNameInBackground(id: string) {

    }

    resolveSteamGameName(item: string) {
        // item is "steam_app_<number>"
        const match = item.match(/steam_app_(\d+)/);
        if (match) {
            const appId = match[1];
            let resolvedName = this.mapping.fetch(appId);
            if(resolvedName.isInElse) {
                this.resolveGameNameInBackground(appId);
                resolvedName.bindLeft(`Steam Game ${appId}`);
            }
        }
    }

    //? Will be used later
    async updateMapping(key: string, value: string): Promise<Box<boolean, unknown>> {
        try {
            if (!(this._locationExists && this._mappingExists)) {
                return Box.ok(false);
            }

            this.mapping.set(key, value);
            await writeTextFile("mapping.json",
                JSON.stringify(this.mapping, null, 2),
                {baseDir: BaseDirectory.AppConfig});

            return Box.ok(true);
        } catch (e) {
            return Box.error(e)
        }
    }

    capitalize(word: string): string {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    resolveComplex(item: LogEntry<Date>): string {
        if (!item.process_name && !item.window_title) {
            return "UNKNOWN"
        }

        if (/^[a-z]+-[a-z]{32}-.+$/.test(item.process_name)) {
            console.log("[DETECTED PWA pattern]");
            // window title can be: <program name> - <something>, I should remove both the colon and something
            const maybeName = item.window_title.split("-"); //? there can be more than two
            console.log("[SPLIT]:", maybeName);
            const someName = maybeName[0].replace(/\s/, "");
            console.log("[REPLACE]:", someName);
            // hopefully this will be a usable value
            return this.capitalize(someName);
        }

        const vb = this.mapping.fetch(item.process_name).unwrapOr("");
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
        const vb = this.mapping.fetch(name).unwrapOr("");
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

class SteamNameResolver {
    //TODO
}

export const resolver = new NameResolver();