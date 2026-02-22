import {Temporal} from "@js-temporal/polyfill";
import {Box} from "$lib/types/box";
import Instant = Temporal.Instant;

export class SimpleDuration {
  public days: number = 0;
  public hours: number = 0;
  public minutes: number = 0;
  public seconds: number = 0;

  start?: Temporal.Instant;
  end?: Temporal.Instant;

  constructor(start: Instant, end: Instant);
  constructor(start: number, end: number);
  constructor();
  constructor(start?: number | Instant, end?: number | Instant) {
    if (start === undefined && end === undefined) {
      return;
    } else if (typeof start === "number" && typeof end === "number") {
      this.start = Instant.fromEpochMilliseconds(start);
      this.end = Instant.fromEpochMilliseconds(end);
      this.secondsToFull((end - start) / 1000);
    } else {
      this.start = start as Instant;
      this.end = end as Instant;
      const seconds = this.start
          .until(this.end)
          .total("second");
      this.secondsToFull(seconds);
    }
  }

  static fromSeconds(seconds: number) {
    return (new SimpleDuration()).secondsToFull(seconds);
  }

  static offsetFromDate(offset: number, date: Date = new Date()): SimpleDuration {
    const endMs = date.getTime();

    const midnight = new Date(date);
    midnight.setHours(0, 0, 0, 0);
    const midnightMs = midnight.getTime();

    const offsetStartMs = endMs - (offset * 1000);
    const startMs = Math.max(midnightMs, offsetStartMs);

    return new SimpleDuration(startMs, endMs);
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

  public add(other: SimpleDuration) {
    this.days += other.days;
    this.hours += other.hours;
    this.minutes += other.minutes;
    this.seconds += other.seconds;

    return this.resync();
  }

  public collapseToSeconds() {
    return this.days * 86400 +
        this.hours * 3600 +
        this.minutes * 60 +
        this.seconds;
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

  private static stringify(val: number): string {
    return (val < 10 ? "0" : "") + String(val)
  }

  public format() {
    const seconds = SimpleDuration.stringify(this.seconds);
    const minutes = SimpleDuration.stringify(this.minutes);
    const hours = SimpleDuration.stringify(this.hours);

    return (this.days > 0 ? `${this.days}:` : "") +
        `${hours}:${minutes}:${seconds}`;
  }

  static format_seconds(total_seconds: number): string {
    total_seconds = Math.floor(total_seconds);
    const days = Math.floor(total_seconds / 86400);
    total_seconds %= 86400;

    const hours = Math.floor(total_seconds / 3600);
    total_seconds %= 3600;

    const minutes = Math.floor(total_seconds / 60);
    const seconds = total_seconds % 60;

    return (days > 0 ? days + ":" : "") +
        SimpleDuration.stringify(hours) + ":" +
        SimpleDuration.stringify(minutes) + ":" +
        SimpleDuration.stringify(seconds)
  }
}
