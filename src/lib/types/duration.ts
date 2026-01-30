import {Temporal} from "@js-temporal/polyfill";
import {Box} from "$lib/types/box";

export class Duration {
  public days: number = 0;
  public hours: number = 0;
  public minutes: number = 0;
  public seconds: number = 0;

  start: Box<Temporal.Instant, undefined>
  end: Box<Temporal.Instant, undefined>

  constructor(start?: Date, end?: Date) {
    if (start && end) {
      this.start = Box.ok(Temporal.Instant.fromEpochMilliseconds(start.getTime()));
      this.end = Box.ok(Temporal.Instant.fromEpochMilliseconds(end.getTime()));

      const seconds = this.start
          .zipWith(
              this.end,
              (a, b) => a.until(b).total("second"))
          .unwrapOk()
      this.secondsToFull(seconds);
    } else {
      this.start = Box.error(undefined);
      this.end = Box.error(undefined);
    }
  }

  static from_valueOf(start: number, end: number) {
    return new Duration(new Date(start), new Date(end));
  }

  static from_seconds(seconds: number) {
    return (new Duration()).secondsToFull(seconds);
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
