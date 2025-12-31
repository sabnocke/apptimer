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
    classes?: string[] | string
}

export interface GanttRow {
    id: string | number;
    label: string;
    tasks: GanttTask<number>[];
}

export interface DateTimeFormatOptions {
    localeMatcher?: "best fit" | "lookup" | undefined
    weekday?: "long" | "short" | "narrow" | undefined
    era?: "long" | "short" | "narrow" | undefined
    year?: "numeric" | "2-digit" | undefined
    month?: "numeric" | "2-digit" | "long" | "short" | "narrow" | undefined
    day?: "numeric" | "2-digit" | undefined
    hour?: "numeric" | "2-digit" | undefined
    minute?: "numeric" | "2-digit" | undefined
    second?: "numeric" | "2-digit" | undefined
    timeZoneName?: "short" | "long" | "shortOffset" | "longOffset" | "shortGeneric" | "longGeneric" | undefined
    formatMatcher?: "best fit" | "basic" | undefined
    hour12?: boolean | undefined
    timeZone?: string | undefined
}