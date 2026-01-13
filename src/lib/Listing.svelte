<script lang="ts">
    import {dataSource} from "$lib/services";
    import OneListing from "$lib/OneListing.svelte";
    import {Timing, Box} from "$lib/types";
    import type {LogEntry} from "$lib/services/dataProvider.svelte";
    import {resolver} from "$lib/services";

    $effect(() => {
        return dataSource.subscribe(false);
    });

    interface DisplayData {
        id: number;
        name: string;
        start: Date;
        end: Date;
        time: Timing;
    }

    interface Record {
        id: number
        name: string
    }

    const parsedData_: DisplayData[] = $derived.by(() => {
        if (dataSource.getUniqueNames.length === 0) {
            //? Might this help with reduce being used, and failing, on empty array
            return [];
        }

        const box: Box<DisplayData, Record>[] = dataSource.getUniqueNames.map((name, id) => {
            const f: LogEntry<Date>[] = dataSource.lookup.get(name) || [];

            if (f.length === 0) {
                return Box.else({id, name});
            }

            const m = f.map(one => new Timing(one.start_time, (one.end_time ?? one.temp_end_time)));

            const begin = Math.min(...f.map(one => one.start_time.valueOf()));
            const end = Math.max(...f.map(one => (one.end_time ?? one.temp_end_time).valueOf()));
            const time = m.reduce((acc, item) => acc.add(item), new Timing()).resync();

            const d: DisplayData = {
                id,
                name,
                start: new Date(begin),
                end: new Date(end),
                time
            }

            return Box.ok(d);
        })

        const [success, failure] = Box.partition<DisplayData, Record>(...box);
        failure.forEach(
            ({id, name}) => console.warn(`Entry (${id}, ${name}) doesn't have associated data!`)
        );

        return success;
    })

    const total: Timing = $derived(
        Timing.from_seconds(
            parsedData_
                .filter(value => value !== null)
                .map(one => one.time.collapseToSeconds())
                .reduce((acc, item) => acc + item, 0)
        )
    );

    const sorted = $derived.by(() => {
        return parsedData_.sort((a, b) => {
            const sa = a.time.collapseToSeconds();
            const sb = b.time.collapseToSeconds();
            return sb - sa;
        })
    })

    function getPercentage(up: Timing, down: Timing): string {
        const ups = up.collapseToSeconds();
        const downs = down.collapseToSeconds();
        if (downs === 0) return "0%";
        return (ups / downs * 100).toFixed(2) + "%";
    }
</script>

<div class="display">
    {#if dataSource.loading}
        <div>LOADING</div>
    {:else if dataSource.isErrorSet}
        {@const {from, message} = dataSource.error}
        <div>{from}</div>
        <div>{message}</div>
    {:else}
        {#each sorted as {id, name, start, end, time} (id)}
            <OneListing
                    name={resolver.resolve(name)}
                    time={time.format()}
                    percentage={getPercentage(time, total)}
                    start={start}
                    end={end}
            />
        {/each}
        <div>{total.format()}</div>
    {/if}
</div>