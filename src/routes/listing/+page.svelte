<script lang="ts">
    import {dataSource} from "$lib/services/dataProvider.svelte";
    import RadioButtons from "$lib/RadioButtons.svelte";
    import {Timing} from "$lib/types";
    import {createPathMap} from "$lib/services/utils";
    import OneListing from "$lib/OneListing.svelte";
    import {parse} from "svelte/compiler";

    $effect(() => {
        return dataSource.subscribe();
    });

    $effect(() => {
        $inspect(dataSource.data);
    });

    const pathMap = createPathMap(["Graph", "/"], ["List", "#"])

    interface DisplayData {
        id: number;
        name: string;
        start: Date;
        end: Date;
        time: Timing;
    }

    const parsedData = $derived.by(() => {
        const out: Map<string, DisplayData> = new Map();
        dataSource.uniqueNames().forEach((name, id) => {
            const f = dataSource.filter(item => item.process_name === name);
            const m = f.map(item => new Timing(item.start_time, item.end_time ?? item.temp_end_time));
            const begin = Math.min(...f.map(x => x.start_time.valueOf()));
            const end = Math.max(...f.map(x=> x.start_time.valueOf()));

            const result = m.reduce((acc, item) => acc.add(item));
            const item: DisplayData = {
                id,
                name,
                start: new Date(begin),
                end: new Date(end),
                time: result.resync(),
            };

            out.set(name || "%MISSING_NAME%", item);
        });

        return out;
    });

    $effect(() => {
        console.log(parsedData);
    })

    const total = $derived.by(() => {
        const t_seconds = parsedData
            .values()
            .reduce<number>((acc, item) => acc + item.time.collapseToSeconds(), 0)
        return Timing.from_seconds(t_seconds);
    });

    function getPercentage(up: Timing, down: Timing): string {
        return ((up.collapseToSeconds() / down.collapseToSeconds()) * 100).toFixed(2) + "%";
    }

    const sorted = $derived([...parsedData.entries()].sort((a, b) => {
        const [, t0] = a;
        const [, t1] = b;
        const sa = t0.time.collapseToSeconds() / total.collapseToSeconds();
        const sb = t1.time.collapseToSeconds() / total.collapseToSeconds();

        return sb - sa;
    }));
</script>

<div class="container">
    <div class="container__controls">
        <RadioButtons names={pathMap} active="List" />
    </div>
    <div class="container__display">
        {#each sorted as [name, display] (display.id)}
            {@const time = display.time}
            <OneListing
                    name={name}
                    time={time.format()}
                    percentage={getPercentage(time, total)}
                    start={display.start}
                    end={display.end}
            />
        {/each}
    </div>
    <div class="total-time">
        <span>Total time: {total.format()}</span>
    </div>
</div>

<style lang="scss">
    .container {
      display: flex;
      height: 100%;
      width: 100%;

      &__controls {
        height: 20%;
      }
      &__display {
        height: 80%;
        width: 100%;

        display: flex;
        flex-direction: column;
        align-items: stretch;
        background: #24c8db;

        flex: 1 1 0;
        min-height: 0;
        overflow-y: auto;
      }
    }

    .total-time {
      flex: 0 0 auto;
      margin-bottom: 1rem;
    }
</style>