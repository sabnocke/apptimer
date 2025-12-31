import {Box} from "$lib/types";

export class SuperMap<K, V> extends Map<K, V> {
    constructor(entries?: readonly (readonly [K, V])[] | null) {
        super(entries)
    }

    static groupBy<T, K>(source: Iterable<T>, keySelector: (val: T, index: number) => K) {
        const r = new SuperMap<K, T[]>();

        const coll = Array.from(source);

        for (let i = 0; i < coll.length; i++) {
            const item = coll[i];
            const candidate = keySelector(item, i);
            // const filtered = coll.filter(item => item)
            if (r.has(candidate)) {
                const arr = r.get(candidate)!;
                arr.push(item);
                r.set(candidate, arr);
            } else {
                r.set(candidate, []);
            }
        }

        return r;
    }

    fetch<D = unknown>(key: K, fallback?: D): Box<V, D> {
        const b = new Box<V, D>();

        if (this.has(key)) {

            return b.bindLeft(super.get(key)!);
        } else {
            return fallback ? b.bindRight(fallback) : b
        }
    }
}