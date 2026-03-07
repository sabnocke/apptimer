import {dataSource} from "$lib/services/dataProvider.svelte";

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