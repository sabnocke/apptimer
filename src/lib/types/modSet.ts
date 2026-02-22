export class ModSet<T> extends Set<T>{
    constructor(source?: Iterable<T> | null) {
        super(source);
    }

    public map<R>(fn: (one: T) => R): ModSet<R> {
        const out = new ModSet<R>();
        for(const item of this) {
            out.add(fn(item));
        }

        return out;
    }

    public filter(fn: (one: T) => boolean): ModSet<T> {
        const out = new ModSet<T>();
        for (const item of this) {
            if (fn(item)) out.add(item);
        }

        return out;
    }

    public get first(): T | undefined {
        return this.values().next().value;
    }
}