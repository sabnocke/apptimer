import {invoke} from "@tauri-apps/api/core"

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

// $effect(() => {})

// export let dataSource = $state(await fetchData());
/*
export let parsedProcessNames = $derived.by(() => {
  return dataSource.map(x => x.process_name)
});*/
