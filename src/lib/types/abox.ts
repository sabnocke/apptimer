import {Box} from "$lib/types/box";

type UnpackIterable<T> = T extends Iterable<infer U> ? U : T;
export type ChainableAsyncBox<T> = AsyncBox<T> & (
    T extends object ? { [K in keyof T]: ChainableAsyncBox<T> } : {}
    );

export class AsyncBox<Ok, Else = Error> implements PromiseLike<Box<Ok, Else>> {
    private promise: Promise<Box<Ok, Else>>;

    private constructor(p: Promise<Box<Ok, Else>>) {
        this.promise = p.then(b => Box.from(b));
    }

    static fromPromise<T>(p: Promise<T>): AsyncBox<T, Error> {
        return new AsyncBox<T, Error>(
            p.then(r => Box.ok<T, Error>(r))
                .catch(r => Box.error<T, Error>(r))
        );
    }

    static ok<T, E = never>(val: T): AsyncBox<T, E> {
        return new AsyncBox(Promise.resolve(Box.ok(val)));
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

    async then<TResult1 = Box<Ok, Else>, TResult2 = never>(
        onFulfilled?: ((value: Box<Ok, Else>) => TResult1 | PromiseLike<TResult1>) | null,
        onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
        return this.promise.then<TResult1, TResult2>(onFulfilled, onRejected)
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

    zipWith<T, R>(
        other: AsyncBox<T, Else>,
        fn: (a: Ok, b: T) => R
    ): AsyncBox<R, any> {
        return new AsyncBox(
            Promise.all([this.promise, other.promise])
                .then(([box1, box2]) => {
                    return box1.fold(
                        (v) => box2.fold(
                            (inner) => Box.ok(fn(v, inner)),
                            (e) => Box.error(e)
                        ),
                        (e) => Box.error(e)
                    );
                })
        );
    }

    static join<T extends any[], E>(
        ...items: { [K in keyof T]: AsyncBox<T[K], E>}
    ): AsyncBox<T, E> {
        const promises = items.map(i => i.promise);
        const pr = Promise.all(promises).then(all => {
            const results: any[] = [];
            for (const rawBox of all) {
                const box = Box.from(rawBox);

                const state = box.fold<{isErr: boolean, val?: any, err?: E}>(
                    v => ({isErr: false, v}),
                    e => ({isErr: true, e})
                );

                if (state.isErr) {
                    return Box.error<T, E>(state.err!);
                }

                results.push(state.val);
            }

            return Box.ok<T, E>(results as T);
        });
        return new AsyncBox(pr);
    }

    prop<K extends keyof Ok>(key: K): AsyncBox<Ok[K], Else> {
        return new AsyncBox(
            this.promise
                .then<Box<Ok[K], Else>>(box => box.fold(
                    (val) => Box.ok<Ok[K], Else>(val[key]),
                    (e) => Box.error<Ok[K], Else>(e)
                ))
        );
    }

    filter<T>(this: AsyncBox<T[], any>, fn :(value: T, index: number, obj: T[]) => boolean): AsyncBox<T[], any> {
        return new AsyncBox(
            this.promise.then(rawBox => {
                const box = Box.from(rawBox);

                return box.fold(
                    val => Box.ok(val.filter(fn)),
                    e => Box.error(e as unknown)
                )
            })
        );
    }

    reduce<T>(
        this: AsyncBox<T[], any>,
        fn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
        initialValue?: T
    ): AsyncBox<T, any> {
        return new AsyncBox<T, any>(
            this.promise.then(box => box.fold(
                val => Box.ok(initialValue ? val.reduce(fn, initialValue) : val.reduce(fn)),
                e => Box.error(e)
            ))
        );
    }

    flatten<T, E>(this: AsyncBox<AsyncBox<T, E>, any>): AsyncBox<T, E> {
        return new AsyncBox<T, E>(
            this.promise.then(outer => {
                return outer.fold<Promise<Box<T, E>> | Box<T, E>>(
                    v => v.promise,
                    e => Box.error(e as unknown as E)
                )
            })
        );
    }
}

/*
reduce(
    callbackfn: (previousValue: Timing, currentValue: Timing, currentIndex: number, array: Timing[]) => Timing,
): Timing
*/