import {Box, AsyncBox, type AppStats} from "$lib/types";
import {listen} from "@tauri-apps/api/event";
import {getDayLogs, getUniqueNames, getStatsInRange, type DailyAppStat, getDailyBreakdown} from "$lib/services";
import {resolver} from "$lib/services";

export interface LogEntry<T> {
    id: number,
    process_name: string,
    window_title: string,
    display_name?: string,
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
    from?: string
    message?: string
}

class Provider extends Array {
    data: LogEntry<Date>[] = $state<LogEntry<Date>[]>([]);
    data2 = $state<AppStats[]>([]);
    data3 = $state<DailyAppStat[]>([]);
    private uniqueNames_: string[] = $state<string[]>([]);
    lookup: Map<string, LogEntry<Date>[]> = $derived(Map.groupBy(this.data, val => val.process_name));

    loading: boolean = $state(true);
    loadedPast: boolean = false;

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
        //! UNUSED in Listing2
        //! Possibly unnecessary
        return this.uniqueNames_;
    }

    get isErrorSet(): boolean {
        return this.error_.from !== undefined && this.error_.message !== undefined;
    }

    get error(): ErrorRecord {
        return this.error_;
    }

    subscribe(type: "range" | "daily") {
        const start = type === "range" ? this.startListenRange : this.startListenDaily;
        const stop = type === "range" ? this.stopListenRange : this.stopListenDaily;

        this.listeners += 1;
        if (this.listeners === 1) {
            start();
        }

        return () => {
            this.listeners -= 1;
            if (this.listeners === 0) {
                stop();
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
        //! listen can't be used in this way, as it currently doesn't match with what the provider gives
        //TODO change the listen to wait for "refresh" signal and then update the source
        listen<LogEntry<string>[]>("activity_change", event => {
            console.log("new items", event.payload);
            event.payload.forEach(entry => {
                this.data.push(this.stringToDate(entry));
            })
        }).then(fn => this.unListen_ = fn);
        this.load();
        this.listenerActive = true;
    }

    public newPolling(pollRate: number = 5000): (() => void) {
        this.listeners++;
        if (this.listeners == 1) {
            console.log("...newPolling...");
            this.altLoadSpecific().then();
            this.intervalId = setInterval(() => this.altLoadSpecific().then(), pollRate);
        }

        return () => {
            this.listeners--;
            if (this.listeners == 0) {
                this.stopPolling();
            }
        }
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

    private startPolling(
        usePolling: boolean = true,
        useListen: boolean = false,
        pollInterval: number = 1000
    ): void {
        this.synUniqueNames();
        if (usePolling) {
            console.log("usePolling");
            this.load();
            this.intervalId = setInterval(() => this.load(), pollInterval);
            this.altLoadSpecific(new Date()).then();
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

    private startListenRange(): void {
        listen<null>("refresh-source", payload => {
            dataSource.loadGetStatsInRange().then();
        }).then(fn => this.unListen_ = fn);
        this.listenerActive = true;

        dataSource.loadGetStatsInRange().then();
    }

    private startListenDaily(): void {
        listen<null>("refresh-source", payload => {
            this.loadGetStatsInRange().then();
        }).then(fn => this.unListen_ = fn);
        this.listenerActive = true;

        this.loadGetStatsInRange().then();
    }

    private stopListenRange(): void {
        if (this.unListen_ === null) {
            return;
        }

        this.unListen_();
        this.listenerActive = false;
    }

    private stopListenDaily(): void {
        if (this.unListen_ === null) return;

        this.unListen_();
        this.listenerActive = false;
    }

    synUniqueNames() {
        //! Possibly unnecessary
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

    private preprocess(): void {
        console.log("[CALL preprocess]");
        if (!this.data || this.data.length === 0) return;

        this.data = this.data.map<LogEntry<Date>>(item => ({
            ...item,
            display_name: resolver.resolveComplex(item),
        }));
    }

    public load() {
        this.fetchData().then(b => b.action(
            v => {
                this.data = v;
                this.preprocess();
            },
            e => this.error_ = {from: "fetchData", message: String(e)}
        ));

        this.loading = false;
    }

    public loadSpecific(date: Date): void {
        console.log(`Change of date: ${date}`);

        this.fetchDataSpecific(date).then(b => b.action(
            v => {
                this.data = v;
                this.preprocess();
            },
            e => this.error_ = {from: "fetchData", message: String(e)}
        ));

        console.log("this.data: ", $state.snapshot(this.data));

        this.loading = false;
        if (date.valueOf() !== Date.now()) {
            this.loadedPast = true;
        }
        this.preprocess();
    }

    public async altLoadSpecific(date: Date = new Date(), silent: boolean = false): Promise<void> {
        //* The important function
        console.log("[altLoadSpecific]: called");

        if (!silent)
            this.loading = true;

        try {
            /*const b = (await this.loadGetStatsInRange(date))
                .actionRight(e => this.error_ = {from: "fetchData", message: String(e)})
                .unwrapOr([]);

            this.data2 = b;*/

            /*if (JSON.stringify(b) !== JSON.stringify(this.data2))
                this.data2 = b;*/
        } catch (e) {
            console.error("Catch block error: ", e);
            this.error_ = { from: "altLoadSpecific", message: String(e) };
        } finally {
            this.loading = false;
            console.log("Exit (correct data):", $state.snapshot(this.data2));
        }
    }

    public async loadGetStatsInRange(date: Date = new Date()): Promise<Box<true, unknown>> {
        this.loading = true;

        try {
            this.data2 = await getStatsInRange(date);
            console.log("altFetchData", this.data2);
            return Box.ok(true);
        } catch (e) {
            return Box.error(e);
        } finally {
            this.loading = false;
        }
    }

    public async loadGetDailyBreakdown(date: Date): Promise<Box<DailyAppStat[], unknown>> {
        try {
            return Box.ok(
                await getDailyBreakdown(date, date)
            )
        } catch (e) {
            return Box.error(e);
        }
    }

    public async fetchData(): Promise<Box<Array<LogEntry<Date>>, unknown>> {
        try {
            const r = (await getDayLogs())
                .map<LogEntry<Date>>(item => {
                    return {
                        ...item,
                        display_name: item.process_name,
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

    public async fetchDataSpecific(date: Date): Promise<Box<Array<LogEntry<Date>>, unknown>> {
        try {
            const r = (await getDayLogs(date)).map<LogEntry<Date>>(item => ({
                ...item,
                display_name: item.process_name,
                start_time: new Date(item.start_time),
                temp_end_time: new Date(item.temp_end_time),
                end_time: item.end_time ? new Date(item.end_time) : null,
            }));
            return Box.ok(r);
        } catch (e) {
            return Box.error(e);
        }
    }

}

export const dataSource = $state(new Provider());