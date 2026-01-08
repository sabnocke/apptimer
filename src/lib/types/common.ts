import {Timing} from "$lib/types/timing";

export interface SingleEntry {
    id: number,
    title: string,
    time: Timing
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