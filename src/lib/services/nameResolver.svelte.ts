import {Box, SuperMap, type AppDictionary, isSystemNoise} from "$lib/types";
import {loadAppDictionary} from "$lib/services/ipc";
import {findWindowTitles, settings} from "$lib/services";
import {fetch} from "@tauri-apps/plugin-http";
import {SteamAppSchema} from "$lib/interfaces";
import {namingEngine} from "$lib/services/RulesEngine/engine.svelte";

//TODO maybe rely more on manual pattern matching

class NameResolver {
    /*private _locationExists: boolean = false;
    private _mappingExists: boolean = false;*/
    mapping: SuperMap<string, AppDictionary> = new SuperMap();
    public invalid_names = ["UNKNOWN", "Idle/System", "Failed to resolve!"]

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

    /*get mappingExists(): boolean {
        return this._mappingExists;
    }

    get locationExists(): boolean {
        return this._locationExists;
    }*/

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

    /*private async resolveGameNameInBackground(id: string) {
        return await getSteamGameName(parseInt(id, 10))
    }*/

    /*async altMethod(item: string) {
        const match = item.match(/steam_app_(\d+)/);
        if (!match) {
            return;
        }

        const appId = match[1];
        const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`
        console.log("Using url", url);
        const result = await fetch(url, {
            method: "GET",
        });

        if (!result.ok) {
            throw new Error(`HTTP error! Status: ${result.status}`)
        }

        const source = await result.json();
        try {
            const data = SteamAppSchema.parse(source[appId]);
            console.log(data.data.name);
        } catch (e) {
            console.error(e)
        }

    }*/

    async findSteamNameByApi(process_key: string): Promise<string | void> {
        const match = process_key.match(/steam_app_(\d+)/);
        if (!match) {
            return;
        }

        const appId = match[1];
        const url: string = `https://store.steampowered.com/api/appdetails?appids=${appId}`
        const result: Response = await fetch(url, {
            method: "GET"
        });

        if (!result.ok) {
            console.warn("[findSteamNameByApi]", process_key, result.status, result.statusText);
            return;
        }
        const source = await result.json();
        const appSource = SteamAppSchema.parse(source[appId]);
        return appSource.data.name;
    }

    /*resolveSteamGameName(item: string): Box<string, undefined> {
        // item is "steam_app_<number>"
        const match = item.match(/steam_app_(\d+)/);
        if (match) {
            const appId = match[1];
            // fetchSteamGameData(Number.parseInt(appId, 10)).then(item => console.log(item));
            let resolvedName = this.mapping.fetch(appId).mapLeft(b => b.displayName);
            if(!resolvedName.hasContent || resolvedName.isInElse) {
                this.resolveGameNameInBackground(appId)
                    .then(resolvedName.bindLeft)
                    .catch(e => resolvedName.bindLeft(`Steam Game ${appId}`));
            }
            return resolvedName
        }
        return Box.else(undefined);
    }*/

    /*async storeDisplayName(processKey: string, newDisplayName: string): Promise<boolean> /!*?maybe*!/ {
        const r = this.mapping.modify(processKey, item => {
            item.displayName = newDisplayName;
            return item;
        });

        if (r) return r;

        return await updateDisplayName(processKey, newDisplayName);
    }*/

    capitalize(word: string): string {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    private getWindowTitles(process_key: string): Box<string[], unknown> {
        const b = findWindowTitles(process_key);
        if (b.isOk) {
            let res: string[] = [];
            b.unwrapOk().then(v => res = v);
            return Box.ok(res);
        } else {
            return Box.error(b.unwrapElse());
        }
    }

    isSystemNoise(potentialName: string) : boolean {
        return isSystemNoise(potentialName);
    }

    async resolveComplexAsync(process_key: string): Promise<string> {
        if (!process_key) {
            return "UNKNOWN";
        }
        if (settings.aggregate_group() && isSystemNoise(process_key)) {
            return "Idle/System";
        }

        /*const b = this.getWindowTitles(process_key); // does this do something?
        console.log(b)*/

        /*if (b.isInElse) {
            console.error(b.unwrapElse());
            return "Failed to resolve!";
        }*/

        /*const window_titles = new ModSet(b.unwrapOk());
        console.log(window_titles);*/

        // PWA check regex; this could be done on rule basis
        if (/^[a-z]+-[a-z]{32}-.+$/.test(process_key)) {
            console.log("[DETECTED PWA pattern]");
            /*window title can be: <program name> - <something>, I should remove both the colon and something
            const maybeName = window_titles.map(val => val.split('-')[0]).first ?? "Failed to resolve"
            console.log("[SPLIT]:", maybeName);
            const someName = maybeName[0].replace(/\s/, "");
            console.log("[REPLACE]:", someName);
            return this.capitalize(someName);*/
        }

        if (/steam_app_\d+/.test(process_key.toLowerCase())) {
            let one_name = namingEngine.cleanName(process_key);
            if (one_name === process_key) {
                one_name = await this.findSteamNameByApi(process_key) ?? process_key;
            }
            return one_name;
        }

        let newName: string = process_key;
        for (const rule of this.cleanupRules) {
            if(!rule.pattern.test(newName)) continue;
            newName = process_key.replace(rule.pattern, rule.replace);
        }

        return this.capitalize(newName);
    }

    /*resolveComplex(process_key: string): string {
        if (!process_key) {
            return "UNKNOWN"
        }

        if (settings.aggregate_group() && isSystemNoise(process_key)) {
            return "Idle/System";
        }

        const b = this.getWindowTitles(process_key);

        if (b.isInElse) {
            console.error(b.unwrapElse());
            return "Failed to resolve!";
        }

        const window_titles = new ModSet(b.unwrapOk());

        // PWA check regex; this could be done on rule basis
        if (/^[a-z]+-[a-z]{32}-.+$/.test(process_key)) {
            console.log("[DETECTED PWA pattern]");
            // window title can be: <program name> - <something>, I should remove both the colon and something
            const maybeName = window_titles.map(val => val.split('-')[0]).first ?? "Failed to resolve"
            console.log("[SPLIT]:", maybeName);
            const someName = maybeName[0].replace(/\s/, "");
            console.log("[REPLACE]:", someName);
            return this.capitalize(someName);
        }

        if (/steam_app_\d+/.test(process_key.toLowerCase())) {
            // const val = this.resolveSteamGameName(process_key);

            // this.findSteamNameByApi(process_key).then(name => {
            //     if (name) {
            //         maybeName = name;
            //     }
            // });

            // console.log(this.getWindowTitles(process_key));
            //? Maybe the window title has some useful information
            // console.log(`For ${process_key} exists window title: ${window_titles.first}`);
            // console.log(`For ${process_key} exists steam name: ${val.unwrapOr("NONE")}`)
            console.log(`For ${process_key} exists name: ${namingEngine.cleanName(process_key)}`)
            // if (val.isOk) return val.unwrapOk();
        }

        const vb = this.mapping
            .fetch(process_key)
            .mapLeft(b => b.displayName)
            .unwrapOr("");
        if (vb !== "") return vb;

        let newName: string = process_key;
        for (const rule of this.cleanupRules) {
            if(!rule.pattern.test(newName)) continue;
            newName = process_key.replace(rule.pattern, rule.replace);
        }

        return this.capitalize((newName));
    }*/

    /*resolve(name: string): string {
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
    }*/
}

export const resolver = new NameResolver();