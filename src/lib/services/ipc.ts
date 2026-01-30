import {invoke} from "@tauri-apps/api/core";
import type {LogEntry} from "$lib/services/dataProvider.svelte";
import type {AppDictionary, AppStats} from "$lib/types";

export function getTodayLogs() {
    //! maybe deprecated
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

export function updateDisplayName(processKey: string, displayName: string): Promise<boolean> {
    return invoke<boolean>("update_display_name", {process_key: processKey, display_name: displayName});
}

export function getStatsInRange(start: Date | string, end?: Date | string): Promise<AppStats[]> {
    const formatDate = (d: Date | string) =>
        typeof d !== "string" ? d.toLocaleDateString("en-CA") : d;

    let localStart = formatDate(start);
    let localEnd = end ? formatDate(end) : localStart;

    return invoke<AppStats[]>("get_stats_in_range", {startDate: localStart, endDate: localEnd});
}

export function addRecognitionRule(process: string, pattern: string, displayName: string): Promise<boolean> {
    try {
        return invoke<boolean>("add_recognition_rule", {
            process: process,
            pattern: pattern,
            name: displayName
        })
    } catch (e) {
        console.error("Failed to save a rule", e);
        return Promise.resolve(false);
    }
}