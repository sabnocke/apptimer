import {Duration} from "$lib/types/duration";

export interface SingleEntry {
    id: number,
    title: string,
    time: Duration
}

export interface GanttTask<T> {
    id: string | number;
    uid?: string;
    resourceId: number;
    label: string;
    from: T;
    to: T;
    color?: string;
    html?: string;
    classes?: string[] | string;
    processName?: string;
}

export interface GanttRow {
    id: string | number;
    label: string;
    tasks: GanttTask<number>[];
}

export type KnownSelect = "names" | "data"

export interface AppDictionary {
    processKey: string;
    displayName: string;
    iconData: string;
    category: string;
}

export interface AppStats {
    final_name: string;
    process_key: string;
    total_seconds: number;
    session_count: number;
}