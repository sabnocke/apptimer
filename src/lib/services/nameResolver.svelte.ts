import {isSystemNoise} from "$lib/types";
import {settings, capitalize} from "$lib/services";
import {fetch} from "@tauri-apps/plugin-http";
import {SteamAppSchema} from "$lib/interfaces";
import {namingEngine} from "$lib/services/RulesEngine/engine.svelte";

//TODO maybe rely more on manual pattern matching

class NameResolver {
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

    constructor() {}

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

        // PWA check regex; this could be done on rule basis
        if (/^[a-z]+-[a-z]{32}-.+$/.test(process_key)) {
            console.log("[DETECTED PWA pattern]", process_key);
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

        return capitalize(newName);
    }
}

export const resolver = new NameResolver();