import {dataSource} from "$lib/services/dataProvider.svelte";
import type {DailyAppStat} from "$lib/services/chartUtils";

export function parsedDataCreator2() {
    return dataSource
        .uniqueNames()
}

export function selectiveSubscribe(date: Date, print: boolean = true): (() => void) {
    console.log("selectiveSubscribe's date: ", date);
    const isToday: boolean = date.toDateString() === new Date().toDateString();
    if (isToday) {
        if (print) console.log("📅 Viewing Today: Starting Real-time Listener...");
        return dataSource.subscribe();
    } else {
        if (print) console.log("📅 Viewing Past: Real-time updates disabled.");
        return () => null;
    }
}

export const formatter = Intl.DateTimeFormat("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour12: false
});

export const dateFormatter = Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    weekday: "short",
});

export const timeFormatter = Intl.DateTimeFormat("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
});

export function* zip<A, B>(one: ArrayLike<A>, two: ArrayLike<B> | B): Generator<[A, B], void, unknown> {

    const isCollection: boolean =
        two != null &&
        typeof (two as any).length === "number" &&
        typeof two !== "function";

    const len = isCollection ? (two as ArrayLike<B>).length : Infinity;
    const limit = Math.min(one.length, len);

    for (let i = 0; i < limit; i++) {
        if (isCollection) {
            yield [one[i], (two as ArrayLike<B>)[i]];
        } else {
            yield [one[i], two as B];
        }
    }
}

export function split<T>(src: T[], predicate: (value: T, index: number, array: T[]) => boolean, thisArg?: any): [T[], T[]] {
    let pass: T[] = [];
    let fail: T[] = [];
    for (let i = 0; i < src.length; i++) {
        let item = src[i];
        if (predicate(item, i, src)) {
            pass.push(item);
        } else {
            fail.push(item);
        }
    }

    return [pass, fail];
}

export function reduce_if<T>(
    source: T[],
    predicate: (value: T, index: number, array: T[]) => boolean,
    reducer: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
    initialValue: T
) : T {
    return source.reduce((acc, item, currentIndex, array) => {
        return predicate(item, currentIndex, array) ? reducer(acc, item, currentIndex, array) : acc;
    }, initialValue);
}

export function group(src: DailyAppStat[]): DailyAppStat[] {
    const agg: DailyAppStat = {
        day: src[0]?.day || "",
        final_name: "Idle/System",
        process_key: "obfuscated",
        total_seconds: 0,
        session_count: 0
    };

    const result = reduce_if(src,
        (item) => item.final_name === "Idle/System",
        (acc, item) => {
            return {
                ...acc,
                total_seconds: acc.total_seconds + item.total_seconds,
                session_count: acc.session_count + item.session_count
            }
        }, agg
    )

    const fin = src.filter(item => item.final_name != "Idle/System");

    return [...fin, result];
}