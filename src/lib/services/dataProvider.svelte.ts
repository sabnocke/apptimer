import {invoke} from "@tauri-apps/api/core";
import {Box, type GanttTask, AsyncBox} from "$lib/types";
import {resolver} from "$lib/services";
import {listen} from "@tauri-apps/api/event";

export interface LogEntry<T> {
    id: number,
    process_name: string,
    window_title: string,
    start_time: T,
    temp_end_time: T,
    end_time: T | null
}

class Provider extends Array {
    data = $state<LogEntry<Date>[]>([]);
    loading = $state(true);
    error = $state<string | null>(null);
    intervalId: number | null = null;
    listeners: number = 0;
    private unListen: null | (() => void) = null;
    listenerActive = false;
    timeRange = $derived.by(() => {
        if (this.data.length === 0) return {start: 0, end: 0, totalSeconds: 0};

        const times = this.data
            .flatMap(d => [d.start_time.valueOf(), (d.end_time ?? d.temp_end_time).valueOf()])
        const start = Math.min(...times);
        const end = Math.max(...times);
        return {start, end, totalSeconds: Math.ceil((end - start) / 1000)};
    });
    rows = $derived.by(() => {
        return this.uniqueNames()
            .map((name, idx) => (
                {id: idx, name: name, displayName: resolver.resolve(name)}
            ));
    });
    longestTasks = $derived.by(() => {
        const grouped = Map.groupBy(this.data, item => item.process_name);
        const result: GanttTask<number>[] = [];

        for (const [procName, rawItems] of grouped) {
            const row = this.rows.find(r => r.name === procName);
            if (!row || rawItems.length === 0) continue;

            const mapped = rawItems.map<GanttTask<number>>((x, idx) => ({
                id: idx,
                uid: `${x.process_name}-${x.start_time.valueOf()}`,
                resourceId: row.id,
                from: x.start_time.valueOf(),
                to: (x.end_time ?? x.temp_end_time).valueOf(),
                label: "",
                classes: "task-item"
            })).sort((a, b) => a.from - b.from);

            result.push(...this.getLongestChains(mapped));
        }

        return result;
    });

    private getLongestChains(source: GanttTask<number>[]) {
        if (source.length === 0) return [];
        if (source.length === 1) return [...source];

        // 2. Sort by Start Time
        const sorted = source.slice().sort((a, b) => a.from - b.from)

        const chains: GanttTask<number>[] = [];
        let currentChain: GanttTask<number> = {...sorted[0]};

        let currentStart = sorted[0];
        let currentTo = sorted[0].to;

        for (let i = 1; i < sorted.length; i++) { //! potentially might miss something (<= -> <)
            const nextTask = sorted[i];

            if (!nextTask) continue;

            if (nextTask.from <= currentTo) {
                currentTo = Math.max(currentChain.to, nextTask.to);
            } else {
                chains.push({
                    ...currentStart,
                    to: currentTo,
                });

                currentStart = nextTask;
                currentTo = nextTask.to;
            }
        }

        chains.push({
            ...currentStart,
            to: currentTo,
        });

        return chains;
    }

    subscribe(usePolling: boolean = true, pollingRate: number = 1000) {
        this.listeners += 1;
        if (this.listeners === 1) {
            this.startPolling(usePolling, !usePolling, pollingRate);
        }

        return () => {
            this.listeners -= 1;
            if (this.listeners === 0) {
                this.stopPolling();
            }
        }
    }

    private stringToDate(item: LogEntry<string>): LogEntry<Date> {
        return {
            ...item,
            start_time: new Date(item.start_time),
            end_time: item.end_time ? new Date(item.end_time) : null,
            temp_end_time: new Date(item.temp_end_time),
        };
    }

    private newListener() {
        listen<LogEntry<string>[]>("activity_change", event => {
            console.log("new items", event.payload);
            event.payload.forEach(entry => {
                this.data.push(this.stringToDate(entry));
            })
        }).then(fn => this.unListen = fn);
        this.load();
        this.listenerActive = true;
    }

    private removeListener() {
        if (this.listenerActive && this.unListen) {
            this.unListen();
            this.listenerActive = false;
        } else {
            return false;
        }

        return true;
    }

    private startPolling(usePolling: boolean = true, useListen: boolean = false, pollInterval: number = 1000) {
        console.log("Polling started...", usePolling, useListen);
        if (usePolling) {
            this.load();
            this.intervalId = setInterval(() => this.load(), pollInterval);
        }
        else if (useListen)
            this.newListener();
    }

    private stopPolling() {
        console.log("Polling ended...");
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        else if (this.listenerActive)
            this.removeListener();

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
        this.data = this.fetchDataNew()
            .await()
            .actionRight(e => this.error = String(e))
            .unwrapOr([]);
        this.loading = false;
    }

    public load2() {
        const now = new Date();
        this.data = this.fetchDataDelta(now)
            .await()
            .actionRight(e => this.error = String(e))
            .unwrapOr([])
        this.loading = false;
    }

    public fetchDataDelta(now: Date) {
        return AsyncBox
            .fromPromise(invoke<LogEntry<string>[]>("get_logs_delta", {"now": now}))
            .process<LogEntry<Date>>(v => ({
            ...v,
            start_time: new Date(v.start_time),
            temp_end_time: new Date(v.temp_end_time),
            end_time: v.end_time ? new Date(v.end_time) : null
        }));
    }

    private async fetchData() {
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
            return Box.ok<LogEntry<Date>[]>(r);
        } catch (e) {
            return Box.error<LogEntry<Date>[]>(e);
        }
    }

    private fetchDataNew(): AsyncBox<LogEntry<Date>[]> {
        return AsyncBox
            .fromPromise(invoke<LogEntry<string>[]>("get_today_logs"))
            .process<LogEntry<Date>>(item => ({
                ...item,
                start_time: new Date(item.start_time),
                temp_end_time: new Date(item.temp_end_time),
                end_time: item.end_time ? new Date(item.end_time) : null,
            }));
    }
}

export const dataSource = $state(new Provider());