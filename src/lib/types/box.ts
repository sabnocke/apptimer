import type {AsyncBox} from "$lib/types/abox";

type Identity<T> = (v: T) => T;
type UnpackIterable<T> = T extends Iterable<infer U> ? U : T;

export class Box<Ok, Else> {
    // private getVal: Identity<Ok> | null = null;
    private val: Ok | Else
    private isOk_: boolean = false;

    get isOk(): boolean {
        return this.isOk_;
    }

    private constructor(
        v: Ok | Else,
        ok: boolean
    ) {
        this.val = v;
        this.isOk_ = ok;
    }

    private get isInOk(): boolean {
        return !!this.val && this.isOk_;
    }

    get isInElse(): boolean {
        return !!this.val && !this.isOk_;
    }

    /*static of<Ok>(val: Ok): Box<Ok, any> {
        return new Box(() => val, null);
    }*/

    static fromBox<T, E>(b: Box<T, E>): Box<T, E> {
        return new Box<T, E>(b.val, b.isOk_);
    }

    static ok<Ok, Else = never>(val: Ok): Box<Ok, Else> {
        return new Box<Ok, Else>(val, true);
    }

    static error<Ok = never, Else = any>(val: Else): Box<Ok, Else> {
        return new Box<Ok, Else>(val, false);
    }

    static else<Ok = never, Else = any>(val: Else): Box<Ok, Else> {
        return new Box<Ok, Else>(val, false);
    }

    static from<T, E>(b: Box<T, E> | {val: T | E, isOk: boolean}): Box<T, E> {
        if (b instanceof Box) return b;
        if (b.isOk) return Box.ok(b.val as T);
        return Box.error(b.val as E);
    }

    /*static lazy<Ok, Else = any>(): Box<Ok, Else> {
        return new Box<Ok, Else>((v: Ok) => v, null);
    }*/

    unwrapOr(fallback: Ok): Ok {
        if (this.isInOk) return this.val as Ok;
        else return fallback;
    }

    unwrapOk(): Ok {
        if (!this.isOk_)
            throw new Error(`[PANIC]: Expected Ok value Box, but received Else value Box. <${this.val}>`);
        return this.val as Ok;
    }

    unwrapElse(): Else {
        if (!this.isOk_)
            throw new Error(`[PANIC]: Expected Else value Box, but received Ok value Box. <${this.val}>`);
        return this.val as Else;
    }

    action(
        onLeft?: (v: Ok) => void,
        onRight?: (v: Else) => void
    ): this {
        if (onLeft && this.isOk_) {
            onLeft(this.val as Ok);
        } else if (onRight && !this.isOk_) {
            onRight(this.val as Else);
        }

        return this;
    }

    actionLeft(onLeft: (v: Ok) => void): this {
        if (this.isInOk) {
            onLeft(this.val as Ok);
        }

        return this;
    }

    actionRight(onRight: (v: Else) => void): this {
        if (this.isInElse) {
            onRight(this.val as Else);
        }

        return this;
    }

    mapRight<O>(fn: (val: Else) => O): Box<Ok, O> {
        if (this.isInElse)
            return Box.error(fn(this.val as Else));
        return this as any;
    }

    map<V, U>(onLeft: (x: Ok) => V, onRight: (x: Else) => U): Box<V, U> {
        if (this.isInOk) {
            return Box.ok(onLeft(this.val as Ok))
        }
        return Box.else(onRight(this.val as Else))
    }

    process<R>(fn: (val: UnpackIterable<Ok>, index: number) => R): Box<R[], Else> {
        type Inner = UnpackIterable<Ok>;
        if (this.isInOk) {
            const r = (this.val as Inner[]).map(fn);
            return Box.ok(r);
        }

        return Box.error(this.val as Else);
    }

    fold<R>(
        onOk: (val: Ok) => R,
        onErr: (val: Else) => R
    ): R {
        return this.isInOk ? onOk(this.val as Ok) : onErr(this.val as Else);
    }

    /*foldLeft<R>(
        onOk: (val: Ok) => R,
    ) : R {
        return this.isOk ? onOk(this.val as Ok) : this.val as Else;
    }*/

    mapLeft<O>(fn: (val: Ok) => O): Box<O, Else> {
        if (this.isInOk)
            return Box.ok(fn(this.val as Ok));
        return this as any;
    }

    bindLeft(left: Ok) {
        if (this.isOk_)
            this.val = left;
        return this;
    }

    bindRight(right: Else) {
        if (!this.isOk_)
            this.val = right as Else;

        return this;
    }

    bindBox(v: Box<Ok, Else>): this {
        this.isOk_ = v.isOk_;
        this.val = v.val;

        return this;
    }

    flatten<T, E>(this: Box<Box<T, E>, any>): Box<T, E> {
        return this.fold(
            v => v,
            e => Box.error(e)
        )
    }

    flattenRight<T, E>(this: Box<any, Box<T, E>>): Box<T, E> {
        return new Box<T, E>(this.val, this.isOk_);
    }

    with_undefined<T>(this: Box<T | undefined, any>): Box<T, undefined> {
        return this.fold(
            (val) => val !== undefined
                ? Box.ok(val as T)
                : Box.error(undefined),
            (_err) => Box.error(undefined)
        )
    }

    zip<T>(other: Box<T, any>): Box<[Ok, T], any> {
        return this.fold(
            (val) => other.fold(
                (inner) => Box.ok([val, inner]),
                (e) => Box.error<any>(e)
            ),
            (e) => Box.error(e)
        )
    }

    static join<T extends any[], E>(
        ...items: { [K in keyof T]: Box<T[K], E>}
    ): Box<T, E> {
        const results: any[] = [];
        items.forEach(rawBox => {
            const box = Box.from(rawBox);

            const state = box.fold<{isErr: boolean, val?: any, err?: E}>(
                v => ({isErr: false, v}),
                e => ({isErr: true, e})
            );

            if (state.isErr) {
                return Box.error<T, E>(state.err!)
            }

            results.push(state.val);
        });
        return Box.ok<T, E>(results as T);
    }

    disband<T extends any[]>(this: Box<T, Else>): Box<{ [K in keyof T]: Box<T[K], Else>}, Else> {
        return this.mapLeft(list => list.map(item => Box.ok(item)) as any)
    }

    zipWith<T, R>(other: Box<T, any>, fn: (a: Ok, b: T) => R): Box<R, any> {
        return this.zip(other).mapLeft(([a, b]) => fn(a, b));
    }

    consoleError(kind: "log" | "warn" | "error" = "error"): this {
        if (this.isOk_)
            return this;

        switch (kind) {
            case "log":
                console.log(this.val as Else);
                return this;
            case "warn":
                console.warn(this.val as Else);
                return this;
            case "error":
                console.error(this.val as Else);
                return this;
        }
    }

    static partition<Ok, Else>(...boxes: Box<Ok, Else>[]): [Ok[], Else[]] {
        const oks: Ok[] = [];
        const errs: Else[] = [];

        for (const box of boxes) {
            if (box.isOk_) {
                oks.push(box.unwrapOk() as Ok);
            } else if (!box.isOk_) {
                errs.push(box.unwrapElse() as Else);
            }
        }

        return [oks, errs];
    }
}
