import {type TimeRange, SimpleDuration} from "$lib/types";
import {listen} from "@tauri-apps/api/event";
import {type DailyAppStat, getDailyBreakdown} from "$lib/services";
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

interface ErrorRecord {
    from?: string
    message?: string
}

class Provider extends Array {
    private data3 = $state<DailyAppStat[]>([]);
    private uniqueNames_: string[] = $state<string[]>([]);

    private lookup3: Map<string, DailyAppStat[]> = $derived(Map.groupBy(this.data3, val => val.process_key));

    loading: boolean = $state(true);
    loadedPast: boolean = false;

    private error_: ErrorRecord = $state<ErrorRecord>({});

    listeners: number = 0;
    private unListen_: (() => void) = () => {};
    listenerActive = false;

    get data_() {
        return this.data3;
    }

    get lookup() {
        return this.lookup3;
    }

    private set data_(value: DailyAppStat[]) {
        this.data3 = value;
    }

    timeRange: TimeRange = $derived.by<TimeRange>(() => {
        if (this.isEmpty)
            return {start: undefined, end: undefined, totalSeconds: 0}

        const total = this.data_
            .map(item => item.total_seconds)
            .reduce((acc, item) => acc + item, 0);
        const range = SimpleDuration.offsetFromDate(total);
        return {
            start: new Date(range.start?.epochMilliseconds ?? 0),
            end: new Date(range.end?.epochMilliseconds ?? 0),
            totalSeconds: total
        }
    })


    get getUniqueNames(): string[] {
        //! UNUSED in Listing
        //! Possibly unnecessary
        return this.uniqueNames_;
    }

    get isErrorSet(): boolean {
        return this.error_.from !== undefined && this.error_.message !== undefined;
    }

    get error(): ErrorRecord {
        return this.error_;
    }

    get isEmpty(): boolean {
        return this.data3.length === 0;
    }

    public subscribe(): () => void {
        this.listeners += 1;
        if (this.listeners === 1) {
            this.startListenDaily();
        }

        return () => {
            this.listeners -= 1;
            if (this.listeners === 0) {
                this.stopListenDaily();
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

    constructor() {
        super();
    }

    public pause() {
        if (this.listenerActive) {
            this.unListen_();
            this.listenerActive = false;
        } else {
            this.startListenDaily();
        }
    }

    private startListenDaily(): void {
        listen<null>("refresh-source", () => {
            this.load(new Date()).then();
        }).then(fn => this.unListen_ = fn);
        this.listenerActive = true;

        this.load(new Date()).then();
    }

    private stopListenDaily(): void {
        if (this.unListen_ === null) return;

        this.unListen_();
        this.listenerActive = false;
    }

    uniqueNames(): string[] {
        if (this.loading || this.data_.length === 0)
            return [];

        return this.data_.map(one => one.final_name);
    }

    private preprocess(): void {
        console.log("[CALL preprocess]");
        if (this.loading || this.data_.length === 0) return;

        this.data_ = this.data_.map<DailyAppStat>(item => ({
            ...item,
            display_name: resolver.resolveComplex(item),
        }));
    }

    public async load(date: Date): Promise<boolean> {
        return await this.loadGetDailyBreakdown(date);
    }

    public async loadGetDailyBreakdown(date: Date): Promise<boolean> {
        this.loading = true;

        try {
            this.data3 = await getDailyBreakdown(date, date);
            // console.log("loadGetDailyBreakdown", this.data3);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            this.loading = false;
        }
    }
}

export const dataSource = $state(new Provider());