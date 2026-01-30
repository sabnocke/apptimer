import {Temporal} from "@js-temporal/polyfill";
import {Box} from "$lib/types/box";

export class Timing {
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
    return new Timing(new Date(start), new Date(end));
  }

  static from_seconds(seconds: number) {
    return (new Timing()).secondsToFull(seconds);
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

  public add(other: Timing) {
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
}
