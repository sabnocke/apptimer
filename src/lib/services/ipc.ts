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

export function getUniqueNames() {
    return invoke<string[]>("get_unique_names");
}