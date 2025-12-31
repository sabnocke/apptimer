import {BaseDirectory, exists, mkdir, readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";
import {Box, SuperMap} from "$lib/types";

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
    ]

    get mappingExists(): boolean {
        return this._mappingExists;
    }

    get locationExists(): boolean {
        return this._locationExists;
    }

    constructor() {
        this.load().then(b => {
            b.mapRight(e => console.error(e));
        });
    }

    private async load() {
        const b = new Box<boolean>();
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

            return b.bindLeft(true);
        } catch (e) {
            console.log(e);
            return b.bindRight(String(e));
        }
    }

    //? Will be used later
    async updateMapping(key: string, value: string) {
        const b = new Box<boolean>()
        try {
            if (!(this._locationExists && this._mappingExists)) {
                return b.bindLeft(false);
            }

            this.mapping.set(key, value);
            await writeTextFile("mapping.json",
                JSON.stringify(this.mapping, null, 2),
                {baseDir: BaseDirectory.AppConfig});

            return b.bindLeft(true);
        } catch (e) {
            return b.bindRight(e)
        }
    }

    capitalize(word: string): string {
        return word.charAt(0).toUpperCase() + word.slice(1);
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