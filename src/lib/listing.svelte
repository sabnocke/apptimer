<script lang="ts">
  import {EMPTY_LOG, fetchData, type LogEntry} from "$lib/services/dataProvider.svelte"
  import {Timing} from "$lib/types/timing"
  import OneListing from "$lib/OneListing.svelte";

  let displayableData: LogEntry<Date>[] = $state<LogEntry<Date>[]>(EMPTY_LOG);

  //TODO either use listen or just periodically retrieve information using fetchData
  //? for now let's just repeatedly call fetch

  $effect(() => {
    setInterval(() => {
      fetchData().then(coll => {
        displayableData = coll;
      });
    }, 1000);
  });

  interface WindowInfo {
    pid: number,
    window_title: string,
    process_name: string
  }

  /*listen<WindowInfo[]>("activity_change", item => {
    console.log(item);
  })*/



  /*function dateDiff(start: Date, end: Date) {
    let s = moment(start);
    let e = moment(end);

    let seconds = s.diff(e, "second")
    let minutes = s.diff(e, "minute")
    let hours = s.diff(e, "hour")
    let days = s.diff(e, "day")

    return {days, hours, minutes, seconds};
  }*/

  const parsedData = $derived.by(() => {
    const names = new Set(displayableData.map(item => item.process_name))
    const out = new Map<string, Timing>()
    names.forEach(name => {
      const f = displayableData.filter(item => item.process_name === name);
      const m = f.map(item => new Timing(item.end_time ?? item.temp_end_time, item.start_time));

      if (m.length === 0) {
        console.warn(`For name: ${name} exists no data`);
      }
      const result = m.reduce((acc, item) => acc.add(item));

      out.set(name, result.resync());
    });

    return out;
  })

  function getTotal() {
    const t_seconds = parsedData.values().reduce<number>((acc, item) => acc + item.collapseToSeconds(), 0);
    return Timing.from_seconds(t_seconds);
  }

  function getPercentage(up: Timing, down: Timing): string {
    return ((up.collapseToSeconds() / down.collapseToSeconds()) * 100).toFixed(2) + "%"
  }

  function sorted() {
    return [...parsedData.entries()].sort((a, b) => {
      // negative => a < b
      // positive => b < a
      // zero => a == b
      // ^ this is normal (for ascending order),
      // here it is inverted for descending order
      const [, t0] = a;
      const [, t1] = b;
      const sa: number = t0.collapseToSeconds() / getTotal().collapseToSeconds()
      const sb: number = t1.collapseToSeconds() / getTotal().collapseToSeconds()

      return sb - sa;
    });
  }

</script>

<div>
  <div class="list-holder">
    {#each sorted() as [name, timed], i (i)}
      <OneListing name={name} time={timed.format()} percentage={getPercentage(timed, getTotal()) ?? -1}/>
    {/each}
  </div>
  <div>
    <span>Total time: {getTotal().format()}</span>
  </div>
</div>

<style lang="scss">
  .list-holder {
    gap: .5rem;
    display: flex;
    flex-direction: column;
  }
</style>