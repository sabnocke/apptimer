import { readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { parse } from "yaml";

export interface RawRule {
    name: string;
    pattern: string;
    replacement: string;
    flags?: string;
}

export interface AppConfig {
    rules: RawRule[]
}

export interface CompiledRule {
    name: string;
    regex: RegExp;
    replacement: string;
}