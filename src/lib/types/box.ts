type Identity<T> = (v: T) => T;
type UnpackIterable<T> = T extends Iterable<infer U> ? U : T;

export class Lazy<T> {
    private _value: T | null = null;
    private _initialized: boolean = false;

    constructor(private readonly factory: () => T) {}

    get value(): T {
        if (!this._initialized) {
            this._value = this.factory();
            this._initialized = true;
        }
        return this._value!;
    }
}
export class Box<Ok, Else> {
    private getVal: Identity<Ok> | null = null;
    private val: Ok | Else | null = null;
    private isOk: boolean = false;

    private constructor(
        fn: Identity<Ok> | null,
        v: Ok | Else | null,
    ) {
        if (fn) {
            this.getVal = fn;
        } else if (v) {
            this.val = v;
            this.isOk = true;
        }
    }

    private get isInOk(): boolean {
        return !!this.val && this.isOk;
    }

    get isInElse(): boolean {
        return !!this.val && !this.isOk;
    }

    static of<Ok>(val: Ok): Box<Ok, any> {
        return new Box(() => val, null);
    }

    static fromBox<T, E>(b: Box<T, E>): Box<T, E> {
        return new Box<T, E>(null, b.val);
    }

    static ok<Ok, Else = never>(val: Ok): Box<Ok, Else> {
        return new Box<Ok, Else>(null, val);
    }

    static error<Ok = never, Else = any>(val: Else): Box<Ok, Else> {
        return new Box<Ok, Else>(null, val);
    }

    static lazy<Ok, Else = any>(): Box<Ok, Else> {
        return new Box<Ok, Else>((v: Ok) => v, null);
    }

    unwrapOr(fallback: Ok): Ok {
        if (this.isInOk) return this.val as Ok;
        else return fallback;
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
        if (!this.isInOk)
            return new Box<Ok, O>(null, fn(this.val as Else));
        return /*new Box<Ok, O>(true, this.val as Ok);*/ this as any;
    }

    map<U>(fn: (val: Ok) => U): Box<U, Else> {
        if (!this.isInOk)
            return this as any;

        try {
            return Box.ok(fn(this.val as Ok));
        } catch (e) {
            return Box.error(e as Else);
        }
    }

    process<R>(fn: (val: UnpackIterable<Ok>) => R): Box<R[], Else> {
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
            return new Box<O, Else>(null, fn(this.val as Ok));
        return this as any;
    }

    bindLeft(left: Ok, discardFn: boolean = false) {
        if (this.isOk)
            this.val = left;
        if (this.getVal && !discardFn)
            this.val = this.getVal(left);

        return this;
    }

    bindRight(right: Else) {
        if (!this.isOk)
            this.val = right as Else;

        return this;
    }

    /**
     * If box was created with function, calls that function with value of v, else returns self.
     * @param v Value to bind to box
     */
    connect(v: Ok): this {
        if (this.getVal) {
            this.val = this.getVal(v);
            this.isOk = true;

            return this;
        }
        return this;
    }

    bindBox(v: Box<Ok, Else>): this {
        this.isOk = v.isOk;
        this.val = v.val;
        this.getVal = v.getVal;

        return this;
    }

    flatten<T, E>(this: Box<Box<T, E>, any>): Box<T, E> {
        return new Box<T, E>(null, this.val);
    }
}

export type ChainableAsyncBox<T> = AsyncBox<T> & (
    T extends object ? {[K in keyof T]: ChainableAsyncBox<T>} : {}
    );

export class AsyncBox<Ok, Else = Error> /*implements PromiseLike<Ok>*/{
    private promise: Promise<Box<Ok, Else>>;

    private constructor(p: Promise<Box<Ok, Else>>) {
        this.promise = p;
    }

    static fromPromise<T>(p: Promise<T>): AsyncBox<T, Error> {
        return new AsyncBox<T, Error>(
            p.then(r => Box.ok<T, Error>(r))
                .catch(r => Box.error<T, Error>(r))
        );
    }

    static ok<T, E = never>(val: T): AsyncBox<T, Error> {
        return new AsyncBox<T, Error>(Promise.resolve(Box.ok(val)));
    }

    map<R>(fn: (x: Ok) => R): AsyncBox<R, Else> {
        return new AsyncBox<R, Else>(
            this.promise.then(box => box.map(fn))
        );
    }

    process<R>(fn: (v: UnpackIterable<Ok>) => R): AsyncBox<R[], Else> {
        return new AsyncBox(
            this.promise.then(b => b.process(fn))
        );
    }

    await() {
        const box = Box.lazy<Ok, Else>();
        this.promise.then(v => box.bindBox(v))
            .catch(e => box.bindRight(e));

        return box;
    }

    async unwrap(): Promise<Ok> {
        const box = await this.promise;
        return box.fold(
            (val) => val,
            (err) => {throw err;}
        );
    }

    async unwrapOr(fallback: Ok): Promise<Ok> {
        const box = await this.promise;
        return box.unwrapOr(fallback);
    }
}