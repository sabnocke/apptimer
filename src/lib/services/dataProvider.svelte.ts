import {Box, AsyncBox} from "$lib/types";
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

interface ErrorRecord {
    from?: "fetchData" | "uniqueNames"
    message?: string
}

class Provider extends Array {
    data: LogEntry<Date>[] = $state<LogEntry<Date>[]>([]);
    private uniqueNames_: string[] = $state<string[]>([]);
    lookup: Map<string, LogEntry<Date>[]> = $derived(Map.groupBy(this.data, val => val.process_name));

    loading: boolean = $state(true);

    private error_: ErrorRecord = $state<ErrorRecord>({});

    intervalId: number | null = null;
    listeners: number = 0;
    private unListen_: null | (() => void) = null;
    listenerActive = false;

    timeRange = $derived.by(() => {
        if (this.data.length === 0) return {start: 0, end: 0, totalSeconds: 0};

        const times = this.data
            .flatMap(d => [d.start_time.valueOf(), (d.end_time ?? d.temp_end_time).valueOf()])
        const start = Math.min(...times);
        const end = Math.max(...times);
        return {start, end, totalSeconds: Math.ceil((end - start) / 1000)};
    });

    get getUniqueNames(): string[] {
        return this.uniqueNames_;
    }

    get isErrorSet(): boolean {
        return this.error_.from !== undefined && this.error_.message !== undefined;
    }

    get error(): ErrorRecord {
        return this.error_;
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
        }).then(fn => this.unListen_ = fn);
        this.load();
        this.listenerActive = true;
    }

    private removeListener() {
        if (this.listenerActive && this.unListen_) {
            this.unListen_();
            this.listenerActive = false;
        } else {
            return false;
        }
        return true;
    }

    private startPolling(usePolling: boolean = true, useListen: boolean = false, pollInterval: number = 1000) {
        this.synUniqueNames();
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

    synUniqueNames() {
        let result = false;
        this.uniqueNames().unwrapOr([]).then(
            r => {
                if (r.length === 0) {
                    this.error_ = {
                        from: "uniqueNames",
                        message: "Promise resolved successfully, but no valid values obtained!"
                    }
                    result = false;
                } else {
                    this.uniqueNames_ = r
                    result = true;
                }
            },
            e => this.error_ = {from: "uniqueNames", message: String(e)}
        );

        return result;
    }

    uniqueNames(): AsyncBox<string[]> {
        return AsyncBox.fromPromise(getUniqueNames(new Date()));
    }

    public load() {
        this.fetchData().then(b => b.action(
            v => this.data = v,
            e => this.error_ = {from: "fetchData", message: String(e)}
        ));

        this.loading = false;
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