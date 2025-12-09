import moment from "moment";

export class Timing {
  public days: number = 0;
  public hours: number = 0;
  public minutes: number = 0;
  public seconds: number = 0;

  constructor(start: Date, end: Date) {
    let moment_start = moment(start);
    let moment_end = moment(end);
    const seconds = moment_start.diff(moment_end, "s");

    this.secondsToFull(seconds);

    // console.log(seconds);
  }

  static empty() {
    return new Timing(new Date(), new Date()).annul();
  }

  private secondsToFull(seconds: number): this {
    this.days = Math.round(seconds / 86400)
    this.hours = Math.round(seconds / 3600);
    this.minutes = Math.round(seconds / 60);
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

    return this;
  }

  public resync() {
    this.days = this.days + Math.round(this.hours / 24);
    this.hours = (this.hours % 24) + Math.round(this.minutes / 60);
    this.minutes = (this.minutes % 60) + Math.round(this.seconds / 60);
    this.seconds = this.seconds % 60;

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