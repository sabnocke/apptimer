type Identity<T> = (v: T) => T;
type UnpackIterable<T> = T extends Iterable<infer U> ? U : T;

export class Box<Ok, Else> {
    // private getVal: Identity<Ok> | null = null;
    private val: Ok | Else | null = null;
    private isOk: boolean = false;

    private constructor(
        v: Ok | Else | null,
        ok: boolean
    ) {
        if (v) {
            this.val = v;
            this.isOk = ok;
        }
    }

    private get isInOk(): boolean {
        return !!this.val && this.isOk;
    }

    get isInElse(): boolean {
        return !!this.val && !this.isOk;
    }

    /*static of<Ok>(val: Ok): Box<Ok, any> {
        return new Box(() => val, null);
    }*/

    static fromBox<T, E>(b: Box<T, E>): Box<T, E> {
        return new Box<T, E>(b.val, b.isOk);
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

    /*static lazy<Ok, Else = any>(): Box<Ok, Else> {
        return new Box<Ok, Else>((v: Ok) => v, null);
    }*/

    unwrapOr(fallback: Ok): Ok {
        if (this.isInOk) return this.val as Ok;
        else return fallback;
    }

    unwrapOk(): Ok {
        return this.val as Ok;
    }

    unwrapElse(): Else {
        return this.val as Else;
    }

    action(
        onLeft?: (v: Ok) => void,
        onRight?: (v: Else) => void
    ): this {
        if (onLeft && this.isInOk) {
            onLeft(this.val as Ok);
        } else if (onRight && this.isInElse) {
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

    mapLeft<O>(fn: (val: Ok) => O): Box<O, Else> {
        if (this.isInOk)
            return Box.ok(fn(this.val as Ok));
        return this as any;
    }

    bindLeft(left: Ok) {
        if (this.isOk)
            this.val = left;
        return this;
    }

    bindRight(right: Else) {
        if (!this.isOk)
            this.val = right as Else;

        return this;
    }

    bindBox(v: Box<Ok, Else>): this {
        this.isOk = v.isOk;
        this.val = v.val;

        return this;
    }

    flatten<T, E>(this: Box<Box<T, E>, any>): Box<T, E> {
        return new Box<T, E>(null, this.val);
    }

    with_undefined<T>(this: Box<T | undefined, any>): Box<T, undefined> {
        return this.fold(
            (val) => val !== undefined
                ? Box.ok(val as T)
                : Box.error(undefined),
            (_err) => Box.error(undefined)
        )
    }
}
