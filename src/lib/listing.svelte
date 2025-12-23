<script lang="ts">
  //TODO currently making ^right too small and going fullscreen -> windowed will remove the ^right from view entirely

  import {EMPTY_LOG, fetchData, type LogEntry, string2date} from "$lib/services/dataProvider.svelte"
  import {Timing} from "$lib/types/timing"
  import OneListing from "$lib/OneListing.svelte";
  import {listen} from "@tauri-apps/api/event";

  let displayableData: LogEntry<Date>[] = $state<LogEntry<Date>[]>(EMPTY_LOG);

  $effect(() => {
    const int = setInterval(() => {
      fetchData().then(coll => {
        displayableData = coll;
      });
    }, 1000);

    return () => clearInterval(int);
  });

  /*interface WindowInfo {
    pid: number,
    window_title: string,
    process_name: string
  }*/

  /*listen<LogEntry<string>[]>("activity_change", item => {
    console.log("activity_change", item, item.payload);

    // const state = $state.snapshot(displayableData)

    item.payload.forEach(x => {
      displayableData.push(string2date(x));
    })

    /!*if (item.payload.length === 1) {
      const coll = item.payload[0];
      displayableData.push(string2date(coll));
    }

    else if (item.payload.length === 2) {
      const [one, two] = item.payload
      displayableData.push(
              string2date(one),
              string2date(two)
      );
    }*!/

    // console.log(state);
  });*/

  const parsedNames = $derived(new Set(displayableData.map(item => item.process_name)))

  interface DisplayData {
    name: string,
    start: Date,
    end: Date,
    time: Timing,
  }

  /*$effect(() => {
    console.log($state.snapshot(displayableData));
  })*/

  const parsedData = $derived.by(() => {
    const out = new Map<string, DisplayData>()
    parsedNames.forEach(name => {
      const f = displayableData.filter(item => item.process_name === name);
      // console.log(`listing | parsedData | f`, f);
      const m = f.map(item => new Timing(item.end_time ?? item.temp_end_time, item.start_time));
      const begin = Math.min(...f.map(x => x.start_time.valueOf()));
      const end = Math.max(...f.map(x => (x.end_time ?? x.temp_end_time).valueOf()));
      // console.log("listing | parsedData | m", m);

      if (m.length === 0) {
        console.warn(`listing | parsedData | For name: ${name} exists no data`);
        return;
      }
      const result = m.reduce((acc, item) => acc.add(item));

      const item: DisplayData = {
        name: name,
        start: new Date(begin),
        end: new Date(end),
        time: result.resync()
      }

      out.set(name || "%MISSING_NAME%", item);
    });

    return out;
  });

  /*$effect(() => {
    console.log($state.snapshot(parsedData));
  })*/

  function getTotal() {
    const t_seconds = parsedData.values().reduce<number>((acc, item) => acc + item.time.collapseToSeconds(), 0);
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
      const sa: number = t0.time.collapseToSeconds() / getTotal().collapseToSeconds()
      const sb: number = t1.time.collapseToSeconds() / getTotal().collapseToSeconds()

      return sb - sa;
    });
  }

</script>

<div class="list-holder">
  {#each sorted() as [name, display], i (i)}
    <OneListing
            name={name}
            time={display.time.format()}
            percentage={getPercentage(display.time, getTotal()) ?? -1}
            start={display.start}
            end={display.end}
    />
  {/each}
</div>
<div class="total-time">
  <span >Total time: {getTotal().format()}</span>
</div>

<style lang="scss">
  .list-holder {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background-color: #24c8db;

    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
  }

  .total-time {
    flex: 0 0 auto;
    margin-bottom: 1rem;
  }
</style>