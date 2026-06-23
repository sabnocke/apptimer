import {SimpleDuration, type TimeRange} from "$lib/types";
import {listen} from "@tauri-apps/api/event";
import {type DailyAppStat, getDailyBreakdown, resolver} from "$lib/services";

export interface LogEntry<T> {
    id: number,
    process_name: string,
    window_title: string,
    display_name?: string,
    start_time: T,
    temp_end_time: T,
    end_time: T | null
}

interface ErrorRecord {
    from?: string
    message?: string
}

class Provider extends Array {
    private data_ = $state<DailyAppStat[]>([]);
    private error_: ErrorRecord = $state<ErrorRecord>({});
    private unListen_: (() => void) = () => {};
    // private uniqueNames_: string[] = $state<string[]>([]);
    // private lookup3: Map<string, DailyAppStat[]> = $derived(Map.groupBy(this.data, val => val.process_key));

    loading: boolean = $state(true);
    loadedPast: boolean = false;

    listeners: number = 0;
    listenerActive = false;

    get data() {
        return this.data_;
    }

    /*get lookup() {
        return this.lookup3;
    }*/

    /*private set data_(value: DailyAppStat[]) {
        this.data = value;
    }*/

    timeRange: TimeRange = $derived.by<TimeRange>(() => {
        if (this.isEmpty)
            return {start: undefined, end: undefined, totalSeconds: 0}

        const total = this.data
            .map(item => item.total_seconds)
            .reduce((acc, item) => acc + item, 0);
        const range = SimpleDuration.offsetFromDate(total);
        return {
            start: new Date(range.start?.epochMilliseconds ?? 0),
            end: new Date(range.end?.epochMilliseconds ?? 0),
            totalSeconds: total
        }
    })

    get isErrorSet(): boolean {
        return this.error_.from !== undefined && this.error_.message !== undefined;
    }

    get error(): ErrorRecord {
        return this.error_;
    }

    get isEmpty(): boolean {
        return this.data.length === 0;
    }

    public subscribe(): () => void {
        this.listeners += 1;
        if (this.listeners === 1) {
            this.startListenDaily2();
        }

        return () => {
            this.listeners -= 1;
            if (this.listeners === 0) {
                this.stopListenDaily();
            }
        }
    }

    /*private stringToDate(item: LogEntry<string>): LogEntry<Date> {
        return {
            ...item,
            start_time: new Date(item.start_time),
            end_time: item.end_time ? new Date(item.end_time) : null,
            temp_end_time: new Date(item.temp_end_time),
        };
    }*/

    constructor() {
        super();
    }

    public pause() {
        if (this.listenerActive) {
            this.unListen_();
            this.listenerActive = false;
        } else {
            this.startListenDaily2();
        }
    }

    /*private startListenDaily(): void {
        listen<null>("refresh-source", () => {
            this.load(new Date()).then(
                value => this.data = value);
        }).then(fn => this.unListen_ = fn);
        this.listenerActive = true;

        this.load(new Date()).then(
            (value) => this.data = value);
        this.preprocess();
    }*/

    private startListenDaily2(): void {
        listen<null>("refresh-source", () => {
            void this.refreshData(new Date());
        }).then(fn => this.unListen_ = fn);

        this.listenerActive = true;

        void this.refreshData(new Date());
    }

    private stopListenDaily(): void {
        if (this.unListen_ === null) return;

        this.unListen_();
        this.listenerActive = false;
    }

    uniqueNames(): string[] {
        if (this.loading || this.data.length === 0)
            return [];

        return this.data.map(one => one.final_name);
    }

    /*private preprocess(): void {
        console.log("[CALL preprocess]");
        if (this.loading || this.data_.length === 0) return;

        this.data_ = this.data_.map<DailyAppStat>(item => ({
            ...item,
            display_name: resolver.resolveComplex(item.process_key),
        }));
    }*/

    private async preprocess2(rawData: DailyAppStat[]): Promise<DailyAppStat[]> {
        console.log("[CALL preprocess]");
        if (rawData.length === 0) return [];

        return await Promise.all(
            rawData.map(async (item) => ({
                day: item.day,
                final_name: await resolver.resolveComplexAsync(item.process_key),
                process_key: item.process_key,
                total_seconds: item.total_seconds,
                session_count: item.session_count,
            }))
        );
    }

    private async refreshData(date: Date): Promise<void> {
        this.loading = true;
        try {
            const raw = await getDailyBreakdown(date, date);
            this.data_ = await this.preprocess2(raw);
        } catch (e) {
            console.error("Failed to load and process data:", e);
            this.error_ = {from: "refreshData", message: String(e)};
        } finally {
            this.loading = false;
        }
    }

    public async load(date: Date): Promise<DailyAppStat[]> {
        return await this.loadGetDailyBreakdown(date)
    }

    public async loadGetDailyBreakdown(date: Date): Promise<DailyAppStat[]> {
        this.loading = true;
        try {
            // console.log("loadGetDailyBreakdown", this.data3);
            return await getDailyBreakdown(date, date);
        } catch (e) {
            console.error(e);
            return [];
        } finally {
            this.loading = false;
        }
    }
}

export const dataSource = $state(new Provider());