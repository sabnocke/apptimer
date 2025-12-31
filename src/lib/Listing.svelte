<script lang="ts">
    import {dataSource, resolver} from "$lib/services";
    import OneListing from "$lib/OneListing.svelte";
    import {SuperMap, Timing} from "$lib/types";

    $effect(() => {
        return dataSource.subscribe(false);
    });

    interface DisplayData {
        id: number;
        name: string;
        start: Date;
        end: Date;
        time: Timing
    }

    const parsedData = $derived.by(() => {
        const out = new SuperMap<string, DisplayData>();
        dataSource.uniqueNames().forEach((name, id) => {
            const f = dataSource.filter(d => d.process_name === name);
            const m = f.map(d => new Timing(d.start_time, d.end_time ?? d.temp_end_time));
            const begin = Math.min(...f.map(x => x.start_time.valueOf()));
            const end = Math.max(...f.map(x => x.start_time.valueOf()));

            const result = m.reduce((acc, item) => acc.add(item));
            const item: DisplayData = {
                id,
                name,
                start: new Date(begin),
                end: new Date(end),
                time: result.resync()
            }

            out.set(resolver.resolve(name), item);
        });

        return out;
    });

    const total = $derived.by(() => {
        const t_seconds = parsedData
            .values()
            .reduce<number>((acc, item) => acc + item.time.collapseToSeconds(), 0);
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

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    max-height: 50%;
    width: 50%;
  }

  .header {
    display: grid;
    grid-template-columns: 0.75fr 0.75fr 1fr;
    border-bottom: 1px solid black;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;

    &:nth-child(n) {
      font-weight: bold;
      text-align: center;
    }

    &__name {
      border-right: 1px solid rgba(0, 0, 0, 0.1);
      max-width: 278px;
    }
  }

  .sub-header {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .display {
    display: flex;
    flex-direction: column;

    min-height: 0;
    overflow-y: auto;
    z-index: 1;
  }
</style>

<div class="container">
    <div class="header">
        <div class="header__name">Name</div>
        <div class="header__ratio">Ratio</div>
        <div class="sub-header">
            <div class="header__time">From</div>
            <div class="header__time">To</div>
            <div class="header__total">Total</div>
        </div>
    </div>

    <div class="display">
        {#each sorted as [name, display] (display.id)}
            {@const time = display.time}
            <OneListing
                    name={name}
                    time={time.format()}
                    percentage={getPercentage(time, total)}
                    start={display.end}
                    end={display.end}
            />
        {/each}
    </div>

</div>