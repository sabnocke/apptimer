import {Temporal} from "@js-temporal/polyfill";
import {Box} from "$lib/types/box";
import Instant = Temporal.Instant;

export class Duration {
  public days: number = 0;
  public hours: number = 0;
  public minutes: number = 0;
  public seconds: number = 0;

  start?: Temporal.Instant;
  end?: Temporal.Instant;

  private constructor(start: Instant, end: Instant);
  private constructor(start: number, end: number);
  private constructor();
  private constructor(start?: number | Instant, end?: number | Instant) {
    if (start === undefined && end === undefined) {
      return;
    } else if (typeof start === "number" && typeof end === "number") {
      this.start = Instant.fromEpochMilliseconds(start);
      this.end = Instant.fromEpochMilliseconds(end);
      this.secondsToFull((end - start) / 1000);
    } else {
      this.start = start;
    }

  }

  static fromValueOf(start: number, end: number) {
    return new Duration(start, end);
  }

  static from_seconds(seconds: number) {
    return (new Duration()).secondsToFull(seconds);
  }

  static offsetFromDate(offset: number, date: Date = new Date()): Duration {
    const date2 = structuredClone(date);

    date2.setHours(0, 0, 0, 0);
    const dateMidnight = Instant.fromEpochMilliseconds(date2.getTime());
    const ms = offset * 1000;
    const dateStart = Instant.fromEpochMilliseconds(date.getTime()).subtract({seconds: offset});

    if (dateMidnight.valueOf() < dateStart.valueOf()) {
      // use dateStart
      return new Duration(dateStart.valueOf())
    } else if (dateStart.valueOf() < dateMidnight.valueOf()) {
      // use dateMidnight
    } else {
      // doesn't matter they are equal
    }


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

  public add(other: Duration) {
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
    const seconds = Duration.stringify(this.seconds);
    const minutes = Duration.stringify(this.minutes);
    const hours = Duration.stringify(this.hours);

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
        Duration.stringify(hours) + ":" +
        Duration.stringify(minutes) + ":" +
        Duration.stringify(seconds)
  }
}
