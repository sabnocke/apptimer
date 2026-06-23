import type { CompiledRule, AppConfig } from "$lib/services/RulesEngine/intefaces";
import { BaseDirectory, exists, readTextFile, writeTextFile, mkdir } from "@tauri-apps/plugin-fs";
import { openPath } from "@tauri-apps/plugin-opener";
import { parse } from "yaml";
import { appConfigDir, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-shell";


class ProcessNamingEngine {
    private activeRules: CompiledRule[] = [];

    constructor() {
        this.reload();
    }

    reload() {
        this.loadRules().then(rules => {
            const source = parse(rules) as AppConfig;
            this.activeRules = source.rules.map<CompiledRule>(rule => ({
                name: rule.name,
                regex: new RegExp(rule.pattern),
                replacement: rule.replacement
            }));
        });
    }

    async openConfigInDefaultEditor() {
        try {
            const configDir = await appConfigDir();
            const fullPath = await join(configDir, "config.yaml");
            await openPath(fullPath);
        } catch (error) {
            console.error(`Failed to open file: ${error}`)
        }
    }

    async loadRules() {
        const options = {
            baseDir: BaseDirectory.AppConfig
        };
        const filePath = "config.yaml";

        const fileExists = await exists(filePath, options);

        if (!fileExists) {
            console.log("Config not found. Creating default...");

            const configDir = await appConfigDir();
            await mkdir(configDir, {recursive: true})

            const defaultYaml = `rules:\n  - name: "Example Rule"\n    pattern: 'example\\.exe$'\n    replacement: "Example App"`;
            await writeTextFile(filePath, defaultYaml, options)
        }

        return await readTextFile(filePath, options)
    }

    cleanName(rawProcessName: string): string {
        for (const rule of this.activeRules) {
            if (rule.regex.test(rawProcessName)) {
                return rawProcessName.replace(rule.regex, rule.replacement);
            }
        }
        return rawProcessName;
    }
}

export const namingEngine = new ProcessNamingEngine();