import {invoke} from "@tauri-apps/api/core"
import {Ok, Err, ResultAsync, ok, okAsync, errAsync, err} from "neverthrow";
import {Box, type GanttTask} from "$lib/types"

export interface LogEntry<T> {
    id: number,
    process_name: string,
    window_title: string,
    start_time: T,
    temp_end_time: T,
    end_time: T | null
}

const DEFAULT_LOG_ENTRY: LogEntry<Date>[] = []

export const EMPTY_LOG: LogEntry<Date>[] = [
    {
        id: -1,
        process_name: "",
        window_title: "",
        start_time: new Date(),
        temp_end_time: new Date(),
        end_time: new Date()
    }
]

export function string2date(one: LogEntry<string>): LogEntry<Date> {
    return {
        ...one,
        start_time: new Date(one.start_time),
        temp_end_time: new Date(one.temp_end_time),
        end_time: one.end_time ? new Date(one.end_time) : null
    };
}

type Ordering = "ascending" | "descending" | "asc" | "desc";

export async function fetchData() {
    try {
        return (await invoke<LogEntry<string>[]>("get_today_logs"))
            .map(item => {
                return {
                    ...item,
                    start_time: new Date(item.start_time),
                    temp_end_time: new Date(item.temp_end_time),
                    end_time: item.end_time ? new Date(item.end_time) : null
                } as LogEntry<Date>
            });
    } catch (e) {
        console.error(e)
        return DEFAULT_LOG_ENTRY;
    }
}

class Provider extends Array {
    data = $state<LogEntry<Date>[]>([]);
    loading = $state(true);
    error = $state<string | null>(null);

    timeRange = $derived.by(() => {
        if (this.data.length === 0) return {start: 0, end: 0, totalSeconds: 0};

        const times = this.data
            .flatMap(d => [d.start_time.valueOf(), (d.end_time ?? d.temp_end_time).valueOf()])
        const start = Math.min(...times);
        const end = Math.max(...times);
        return {start, end, totalSeconds: Math.ceil((end - start) / 1000)};
    });

    rows = $derived.by(() => {
        return this.uniqueNames().map((name, idx) => ({id: idx, name: name}));
    });

    private getLongestChains(source: GanttTask<number>[]) {
        const validTasks = source.filter(t => t && t.from !== undefined);

        if (validTasks.length === 0) return [];

        // 2. Sort by Start Time
        const sorted = validTasks.slice().sort((a, b) => a.from - b.from)

        const chains: GanttTask<number>[] = [];
        let currentChain: GanttTask<number> = {...sorted[0]};
        /*for (const nextTask of source) {
          if (currentChain === nextTask) continue;

          if (currentChain.to === nextTask.from) {
            currentChain.to = nextTask.to
          } else {
            chains.push(currentChain);
            currentChain = { ...nextTask };
          }
        }*/

        for (let i = 1; i <= sorted.length; i++) {
            const nextTask = sorted[i];

            if (!nextTask) continue;

            if (nextTask.from <= currentChain.to) {
                currentChain.to = Math.max(currentChain.to, nextTask.to);
            } else {
                chains.push(currentChain);
                currentChain = {...nextTask};
            }
        }

        chains.push(currentChain);

        return /*chains[0].id === chains[1].id ? chains.slice(1, -1) : */chains;
    }

    tasks = $derived.by(() => {
        if (this.rows.length === 0) return [];

        const result = this.data.map<GanttTask<number> | null>((x, idx) => {
            const row = this.rows.find(r => r.name === x.process_name);
            if (!row) return null;

            const from = x.start_time.valueOf();
            const to = (x.end_time ?? x.temp_end_time).valueOf();

            return {
                id: idx,
                resourceId: row.id,
                label: "",
                html: `<div style="width:100%; height:100%" title="${x.process_name}: ${(to - from) / 1000}s"></div>`,
                from: from,
                to: to,
                classes: "task-item"
            } as GanttTask<number>;
        }).filter(t => t !== null);

        // return this.getLongestChains(result);
        return result;
    });

    task_map = $derived(Map.groupBy(this.tasks, item => item.resourceId));
    longestTasks = $derived.by(() => {
        const result: GanttTask<number>[][] = [];
        for (const item of this.task_map.values()) {
            result.push(this.getLongestChains(item));
        }

        return result.flat();
    })



    intervalId: number | null = null;
    listeners: number = 0;

    subscribe() {
        this.listeners += 1;
        if (this.listeners === 1) {
            this.startPolling();
        }

        return () => {
            this.listeners -= 1;
            if (this.listeners === 0) {
                this.stopPolling();
            }
        }
    }

    private startPolling() {
        console.log("Polling started...");
        this.load();
        this.intervalId = setInterval(() => this.load(), 1000);
    }

    private stopPolling() {
        console.log("Polling ended...");
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = null;
    }

    constructor() {
        super();
        this.load();
    }

    get length(): number {
        if (this.loading) return 0;
        return this.data.length;
    }

    map<T>(callbackFn: (value: LogEntry<Date>, index: number, array: LogEntry<Date>[]) => T) {
        if (this.loading) return [];
        return this.data.map(callbackFn);
    }

    filter(predicate: (value: LogEntry<Date>, index: number, array: LogEntry<Date>[]) => boolean) {
        if (this.loading) return [];
        return this.data.filter(predicate);
    }

    flatMap<T>(callbackFn: (value: LogEntry<Date>, index: number, array: LogEntry<Date>[]) => T | readonly T[]): T[] {
        if (this.loading) return [];
        return this.data.flatMap(callbackFn);
    }

    uniqueNames(select: (item: LogEntry<Date>) => string = x => x.process_name) {
        if (this.loading) return [];
        return [...new Set(this.data.map(select))];
    }

    public load() {
        // console.log("load() called...");
        this.fetchData()
            .then(item => this.data = item
                .unwrapElse([], e => this.error = `${e}`));
        // console.log("this.data()", $state.snapshot(this.data));
        this.loading = false;
    }

    private async fetchData() {
        // console.log("fetchData() called...");
        const b = new Box<LogEntry<Date>[], unknown>();
        try {
            const r = (await invoke<LogEntry<string>[]>("get_today_logs"))
                .map<LogEntry<Date>>(item => {
                    return {
                        ...item,
                        start_time: new Date(item.start_time),
                        temp_end_time: new Date(item.temp_end_time),
                        end_time: item.end_time ? new Date(item.end_time) : null,
                    };
                });
            // console.log(r);
            // b.bindLeft(r);
            // console.log(b.unwrapOr([]));
            return b.bindLeft(r);
        } catch (e) {
            return b.bindRight(e);
        }
    }

}

export const dataSource = $state(new Provider());