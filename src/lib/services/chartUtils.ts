export function stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 60%)`;
}

export interface DaySegment {
    name: string;
    seconds: number;
    color: string;
    percent: number;
}

export interface ChartDay{
    date: string;
    dayLabel: string;
    totalSeconds: number;
    segments: DaySegment[];
}

export interface DailyAppStat {
    day: string;
    final_name: string;
    process_key: string;
    total_seconds: number;
    session_count: number;
}