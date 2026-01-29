import {invoke} from "@tauri-apps/api/core";
import type {LogEntry} from "$lib/services/dataProvider.svelte";
import type {AppDictionary} from "$lib/types";

export function getTodayLogs() {
    return invoke<LogEntry<string>[]>("get_today_logs");
}

export function getDayLogs(date: Date | null = null) {
    return invoke<LogEntry<string>[]>("get_logs_delta", {
        now: date ?? new Date()
    });
}

export function getUniqueNames(date: Date | null = null) {
    return invoke<string[]>("get_unique_names", {
        when: date
    });
}

export function setLogging(enable: boolean): Promise<boolean> {
    return invoke<boolean>("set_logging", {enable: enable});
}

export function checkAccess(): Promise<boolean> {
    return invoke<boolean>("check_access");
}

export function getSteamGameName(appId: number): Promise<string> {
    return invoke<string>("fetch_load_steam_game_data", {app_id: appId});
}

export function loadAppDictionary(): Promise<AppDictionary[]> {
    return invoke<AppDictionary[]>("load_app_dictionary");
}