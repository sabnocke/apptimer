import {Temporal} from "@js-temporal/polyfill";
import Instant = Temporal.Instant;

type OrderingType = "ascending" | "descending" | "a" | "d" | "asc" | "desc";

export class Timing {
  public days: number = 0;
  public hours: number = 0;
  public minutes: number = 0;
  public seconds: number = 0;

  start: Temporal.Instant
  end: Temporal.Instant

  private created_empty: boolean = false;

  constructor(start: Date, end: Date) {
    this.start = Temporal.Instant.fromEpochMilliseconds(start.getTime());
    this.end = Temporal.Instant.fromEpochMilliseconds(end.getTime());

    const seconds = Math.abs(this.start.until(this.end).total("second"));
    this.secondsToFull(seconds);
  }

  static empty() {
    const t = new Timing(new Date(), new Date()).annul()
    t.created_empty = true;
    return t;
  }

  static from_instant(start: Instant, end: Instant) {
    const t = Timing.empty();
    t.start = start;
    t.end = end;
    const seconds = Math.abs(t.end.until(t.start).total("seconds"));
    t.secondsToFull(seconds);

    return t;
  }

  static from_seconds(seconds: number) {
    const t = Timing.empty();
    return t.secondsToFull(seconds);
  }


  private secondsToFull(seconds: number): this {
    seconds = Math.floor(seconds);

    this.days = Math.floor(seconds / 86400);
    seconds %= 86400;

    this.hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    this.minutes = Math.floor(seconds / 60);
    this.seconds = seconds % 60;

    return this;
  }

  public annul(): this {
    this.days = 0;
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;

    return this;
  }

  public add(other: Timing) {
    this.days += other.days;
    this.hours += other.hours;
    this.minutes += other.minutes;
    this.seconds += other.seconds;

    return this.resync();
  }

  public collapseToSeconds() {
    return this.days * 86400 + this.hours * 3600 + this.minutes * 60 + this.seconds;
  }

  public totalSeconds(): number {
    if (this.created_empty) {
      throw new DOMException("This object was originally created as empty, its Instant objects are only placeholders");
    }

    return Math.abs(this.start.until(this.end).total("seconds"));
  }

  public resync() {
    this.minutes += Math.floor(this.seconds / 60);
    this.seconds %= 60;

    this.hours += Math.floor(this.minutes / 60);
    this.minutes %= 60;

    this.days += Math.floor(this.hours / 24);
    this.hours %= 24;

    return this;
  }

  public static is_today(date: Date) {
    const today = new Date();

    return today.toDateString() === date.toDateString();

  }

  private stringify(val: number): string {
    return (val < 10 ? "0" : "") + String(val)
  }

  public format() {
    const seconds = this.stringify(this.seconds);
    const minutes = this.stringify(this.minutes);
    const hours = this.stringify(this.hours);

    return (this.days > 0 ? `${this.days}:` : "") +
        `${hours}:${minutes}:${seconds}`;
  }

  public reformat() {
    return this.resync().format();
  }

  public cmp(other: Timing, method: "start" | "end", ordering: OrderingType = "ascending"): number {
    // if this is after other => positive
    //
    // if this is before other => negative
    let sign = 0;
    switch (method) {
      case "start":
        sign = Math.sign(other.start.until(this.start).total("seconds"));
        break;
      case "end":
        sign = Math.sign(other.end.until(this.end).total("seconds"));
        break;
    }

    const letter = ordering[0];
    if (letter === "a") {
      return sign;
    } else if (letter === "d") {
      return -1 * sign;
    } else {
      return sign
    }
  }
}
