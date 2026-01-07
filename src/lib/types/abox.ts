import {Box} from "$lib/types/box";

type UnpackIterable<T> = T extends Iterable<infer U> ? U : T;
export type ChainableAsyncBox<T> = AsyncBox<T> & (
    T extends object ? { [K in keyof T]: ChainableAsyncBox<T> } : {}
    );

export class AsyncBox<Ok, Else = Error> implements PromiseLike<Ok> {
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

    map<One, Two>(fn: (x: Ok) => One, fnElse: (x: Else) => Two): AsyncBox<One, Two> {
        return new AsyncBox(
            this.promise.then(box => box.map(fn, fnElse))
        );
    }

    mapLeft<R>(fn: (x: Ok) => R): AsyncBox<R, Else> {
        return new AsyncBox<R, Else>(
            this.promise.then(box => box.mapLeft(fn))
        );
    }

    mapRight<R>(fn: (x: Else) => R): AsyncBox<Ok, R> {
        return new AsyncBox<Ok, R>(
            this.promise.then(box => box.mapRight(fn))
        );
    }

    async then<T, U>(
        onFulfilled?: (value: Ok) => T | PromiseLike<T>,
        onRejected?: ((reason: Else) => U | PromiseLike<U>) | null
    ): Promise<T> {
        const box = await this.promise;
        return box.fold<T>(
            onFulfilled || ((v) => v as any),
            onRejected || ((e) => e as any)
        );
    }

    process<R>(fn: (v: UnpackIterable<Ok>, index: number) => R): AsyncBox<R[], Else> {
        return new AsyncBox(
            this.promise.then(b => b.process(fn))
        );
    }

    castTo<C extends AsyncBox<Ok, Else>>(
        constructor: new (p: Promise<Box<Ok, Else>>) => C
    ): C {
        return new constructor(this.promise);
    }

    tapLeft(fn: (x: Ok) => void): AsyncBox<Ok, Else> {
        return new AsyncBox<Ok, Else>(
            this.promise.then<Box<Ok, Else>>(box => {
                box.actionLeft(fn);
                return box;
            })
        )
    }

    tapRight(fn: (x: Else) => void): AsyncBox<Ok, Else> {
        return new AsyncBox<Ok, Else>(
            this.promise.then(box => {
                box.actionRight(fn);
                return box;
            })
        );
    }

    tap(fn: (x: Ok) => void, fnElse: (x: Else) => void): AsyncBox<Ok, Else> {
        return new AsyncBox<Ok, Else>(
            this.promise.then(box => {
                box.action(fn, fnElse)
                return box;
            })
        );
    }

    andThen(fn: () => void): this {
        fn();
        return this;
    }

    async unwrap(): Promise<Ok> {
        const box = await this.promise;
        return box.fold(
            (val) => val,
            (err) => {
                throw err;
            }
        );
    }

    async unwrapElse<U>(failsafe: (e: Else) => U): Promise<Box<Ok, U>> {
        const box = await this.promise;
        return box.mapRight(failsafe);
    }

    async unwrapOr(fallback: Ok): Promise<Ok> {
        const box = await this.promise;
        return box.unwrapOr(fallback);
    }

    find<T>(
        this: AsyncBox<T[], Else>,
        predicate: (value: T, index: number, obj: T[]) => boolean
    ): AsyncBox<T, undefined> {
        const p = this.promise.then(box => box
            .mapLeft(src => src.find(predicate))
            .with_undefined())
        return new AsyncBox(p);
    }

    bindLeft(val: Ok): AsyncBox<Ok, Else> {
        return new AsyncBox(
            this.promise.then(box => box.bindLeft(val))
        );
    }

    bindRight(val: Else): AsyncBox<Ok, Else> {
        return new AsyncBox(
            this.promise.then(box => box.bindRight(val))
        );
    }

    //Map left with access to right
    chainLeft<T>(fn: (value: Ok, ref: Else) => T) {
        return new AsyncBox(
            this.promise.then(box => box/*TODO .chainLeft*/)
        )
    }

    //Map right with access to left
    chainRight() {}
}