import {SimpleDuration} from "$lib/types";
import {listen} from "@tauri-apps/api/event";
import {type DailyAppStat, getDailyBreakdown, resolver} from "$lib/services";

export interface TimeRange {
    start?: Date;
    end?: Date;
    totalSeconds: number;
}

interface ErrorRecord {
    from?: string
    message?: string
}

class Provider extends Array {
    private data_ = $state<DailyAppStat[]>([]);
    private error_: ErrorRecord = $state<ErrorRecord>({});
    private unListen_: (() => void) = () => {};

    loading: boolean = $state(true);
    loadedPast: boolean = false;

    listeners: number = 0;
    listenerActive = false;

    get data() {
        return this.data_;
    }

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

    private async preprocess2(rawData: DailyAppStat[]): Promise<DailyAppStat[]> {
        console.log("[CALL preprocess]");
        if (rawData.length === 0) return [];

        const result: DailyAppStat[] = await Promise.all(
            rawData.map<Promise<DailyAppStat>>(async (item) => ({
                ...item,
                final_name: await resolver.resolveComplexAsync(item.process_key),
            } as DailyAppStat))
        );
        
        return result.filter(item => item.final_name.toLowerCase() !== "apptimer");
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

    private async loadGetDailyBreakdown(date: Date): Promise<DailyAppStat[]> {
        this.loading = true;
        try {
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