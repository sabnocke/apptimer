import {invoke} from "@tauri-apps/api/core";
import type {LogEntry} from "$lib/services/dataProvider.svelte";

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