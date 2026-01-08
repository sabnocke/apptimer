import {Box, type GanttTask, AsyncBox} from "$lib/types";
import {resolver} from "$lib/services";
import {listen} from "@tauri-apps/api/event";
import {getDayLogs, getUniqueNames} from "$lib/services";

export interface LogEntry<T> {
    id: number,
    process_name: string,
    window_title: string,
    start_time: T,
    temp_end_time: T,
    end_time: T | null
}

interface IRow {
    id: number,
    name: string,
    displayName: string,
}

class Provider extends Array {
    data = $state<LogEntry<Date>[]>([]);
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
        return this
            .uniqueNames()
            .process<IRow>((name, idx) => ({
                id: idx,
                name: name,
                displayName: resolver.resolve(name)
            }));
    });
    longestTasks = $derived.by(() => {
        const grouped = Map.groupBy(this.data, item => item.process_name);
        let result = AsyncBox.ok<GanttTask<number>[], string>([]);

        for (const [procName, rawItems] of grouped) {
            if (rawItems.length === 0) continue;

            const row = this.rows
                .find(r => r.name === procName)
                .mapRight(() => `Row not found: ${procName}`);

            const mapped = row.mapLeft(r =>
            rawItems.map<GanttTask<number>>((value, index) => ({
                id: index,
                uid: `${value.process_name}-${value.start_time.valueOf()}`,
                resourceId: r.id,
                from: value.start_time.valueOf(),
                to: (value.end_time ?? value.temp_end_time).valueOf(),
                label: "",
                classes: "task-item",
                processName: value.process_name,
            })));

            result = result.zipWith(mapped, (a, b) =>
                [...a, ...this.getLongestChains(b)]
            );
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

        for (let i = 1; i < sorted.length; i++) {
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
        // console.log("Polling started...", usePolling, useListen);
        if (usePolling) {
            this.load();
            this.intervalId = setInterval(() => this.load(), pollInterval);
        } else if (useListen)
            this.newListener();
    }

    private stopPolling() {
        // console.log("Polling ended...");
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        } else if (this.listenerActive)
            this.removeListener();
    }

    constructor() {
        super();
        this.load();
    }

    uniqueNames(): AsyncBox<string[]> {
        return AsyncBox.fromPromise(getUniqueNames());
    }

    public load() {
        this.fetchData().then(b => b.action(
            v => this.data = v,
            e => this.error = String(e)
        ));
    }

    public async fetchData(): Promise<Box<Array<LogEntry<Date>>, unknown>> {
        try {
            const r = (await getDayLogs())
                .map<LogEntry<Date>>(item => {
                    return {
                        ...item,
                        start_time: new Date(item.start_time),
                        temp_end_time: new Date(item.temp_end_time),
                        end_time: item.end_time ? new Date(item.end_time) : null,
                    };
                });
            return Box.ok(r);
        } catch (e) {
            return Box.error(e);
        }
    }
}

export const dataSource = $state(new Provider());