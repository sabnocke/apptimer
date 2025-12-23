export class Box<TOk, TElse = unknown> {
    private left: TOk | null = null;
    private right: TElse | null = null;

    constructor(left?: TOk, right?: TElse) {
        if (left) {
            this.left = left;
        } else if (right) {
            this.right = right;
        }
    }

    get isLeft(): boolean {
        return !!this.left;
    }

    get isRight(): boolean {
        return !!this.right;
    }

    static fromOk<T>(val: T) {
        return new Box(val);
    }

    static fromElse<T>(val: T) {
        return new Box(null, val);
    }

    static autoElse<T>() {
        return new Box<T, unknown>();
    }

    unwrapOr(fallback: TOk) {
        if (this.left) return this.left;
        else return fallback;
    }

    unwrapElse(fallback: TOk, elseFn: (item: TElse) => void) {
        if (this.left) return this.left;
        elseFn(this.right!);
        return fallback;
    }

    map<U, F>(fnLeft: (value: TOk) => U, fnRight: (val: TElse) => F): Box<U, F> {
        const b = new Box<U, F>();
        if (this.left) b.left = fnLeft(this.left);
        if (this.right) b.right = fnRight(this.right);

        return b;
    }

    mapLeft<O>(fn: (val: TOk) => O): Box<O, TElse> {
        const b = new Box<O, TElse>();

        if (this.left) {
            b.left = fn(this.left);
        }
        if (this.right) {
            b.right = this.right;
        }

        return b;
    }

    mapRight<O>(fn: (val: TElse) => O): Box<TOk, O> {
        const b = new Box<TOk, O>();
        if (this.left) {
            b.left = this.left;
        }
        if (this.right) {
            b.right = fn(this.right);
        }

        return b;
    }

    bind(left: TOk, right: TElse) {
        this.left = left;
        this.right = right;

        return this;
    }

    bindLeft(left: TOk) {
        this.left = left;

        return this;
    }

    bindRight(right: TElse) {
        this.right = right;

        return this;
    }

    match(leftFn: (item: TOk) => void, rightFn: (item: TElse) => void) {
        if (this.left) {
            leftFn(this.left);
        }
        if (this.right) {
            rightFn(this.right)
        }
    }
}