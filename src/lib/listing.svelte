<script lang="ts">
  import {fetchData, type LogEntry, EMPTY_LOG} from "$lib/services/dataProvider.svelte"
  import {listen} from "@tauri-apps/api/event";
  import {Timing} from "$lib/types/timing"
  import * as dayjs from "dayjs";
  import moment from "moment";
  import OneListing from "$lib/OneListing.svelte";

  let displayableData: LogEntry<Date>[] = $state<LogEntry<Date>[]>(EMPTY_LOG);
  let total = $state(Timing.empty());
  let totalString = $derived(total.resync().format());

  //TODO either use listen or just periodically retrieve information using fetchData
  //? for now let's just repeatedly call fetch

  $effect(() => {
    setInterval(() => {
      fetchData().then(coll => {
        displayableData = coll;
        // console.log(coll);
      });
    }, 1000);
  });

  interface WindowInfo {
    pid: number,
    window_title: string,
    process_name: string
  }

  listen<WindowInfo[]>("activity_change", item => {
    console.log(item);
  })



  function dateDiff(start: Date, end: Date) {
    let s = moment(start);
    let e = moment(end);

    let seconds = s.diff(e, "second")
    let minutes = s.diff(e, "minute")
    let hours = s.diff(e, "hour")
    let days = s.diff(e, "day")

    return {days, hours, minutes, seconds};
  }

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

  function* join(): Generator<[string, Timing]> {
    // let result

    const names = new Set(displayableData.map(item => item.process_name));
    for (const name of names) {
      const f = displayableData.filter(item => item.process_name === name);
      const m = f.map(item => {
        return new Timing(item.end_time ?? item.temp_end_time,  item.start_time);
      });

      if (m.length === 0) {
        throw new DOMException("join(): Nothing to do <-> m.length === 0", "No received data");
      }

      const item = m.reduce((prev, curr) => {
        return prev.add(curr)
      });

      // total.add(item);
      // console.log(total.resync().format());

      yield [name, item.resync()];
    }
  }


</script>

<div>
  {#each parsedData.entries() as [name, timed], i (i)}
    <OneListing name={name} time={timed.resync().format()} percentage={-1} />
  {/each}
  <div>
    <span>Total time: {parsedData.values().reduce((acc, item) => acc.add(item)).resync().format()}</span>
  </div>
</div>