<script lang="ts">
    //TODO change getUniqueNames() to give back names based on current day, giving nothing if it's start

    import {dataSource} from "$lib/services";
    import OneListing from "$lib/OneListing.svelte";
    import {AsyncBox, type GanttTask, Timing} from "$lib/types";

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

    const errorLog = $state(new Set<string>());
    const displayLog = $derived([...errorLog].join("\n"));

    const parsedData = $derived.by(() => {
        return dataSource.uniqueNames().mapLeft(all => {
            const boxes = all.map((name, id) => {
                const f: AsyncBox<GanttTask<number>[], any> = dataSource.longestTasks.filter(d => d.processName === name);
                const m: AsyncBox<Timing[], any> = f.process(d => Timing.from_valueOf(d.from, d.to));

                const begin: AsyncBox<number, any> = f.mapLeft(arr => Math.min(...arr.map(x => x.from)));
                const end: AsyncBox<number, any> = f.mapLeft(arr => Math.max(...arr.map(x => x.to)));
                const sum: AsyncBox<Timing, any> = m
                    .reduce((acc, item) => {
                        acc.add(item);
                        return acc;
                    }, new Timing())
                    .tapRight(e => console.warn(e));

                return AsyncBox.join(begin, end, sum).mapLeft<DisplayData>(([begin, end, sum]) => {
                    console.log("- check sum: ", sum, sum.resync());

                    return {
                        id,
                        name,
                        start: new Date(begin),
                        end: new Date(end),
                        time: sum.resync()
                    }
                }).tap(
                    v => console.warn(v.time),
                    e => console.warn(e)
                );
            });

            return AsyncBox.join(...boxes)
        }).flatten()
    });

    const total = $derived(
        parsedData
            .process(v => v.time.collapseToSeconds())
            .reduce((acc, item) => acc + item, 0)
            .mapLeft(x => Timing.from_seconds(x))
    );

    function getPercentage(up: Timing, down: Timing): string {
        return ((up.collapseToSeconds() / down.collapseToSeconds()) * 100).toFixed(2) + "%";
    }

    const sorted = $derived.by(() => {
        return parsedData.mapLeft(arr => arr.sort((a, b) => {
            const sa = a.time.collapseToSeconds();
            const sb = b.time.collapseToSeconds();
            return sb - sa;
        }))
    })

    function* getIter(src: DisplayData[]) {
        for (const item of src) {
            yield item;
        }
    }

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
        {#await AsyncBox.join(sorted, total) then value}
            {@const maybeValues = value.disband()}
            {#if !maybeValues.isOk}
                <div>Box's string error: {errorLog}</div>
            {:else}
                {@const [sortedValues, bT] = maybeValues.unwrapOk()}
                {@const values = getIter(sortedValues.unwrapOk())}
                {@const t = bT.unwrapOk()}

                {#each values as {id, name, time, start, end} (id)}
                    <OneListing
                            name={name}
                            time={time.format()}
                            percentage={getPercentage(time, t)}
                            start={start}
                            end={end}
                    />
                {/each}
            {/if}
        {:catch e}
            <div>{String(e)}</div>
        {/await}
    </div>

</div>