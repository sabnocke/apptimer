<script lang="ts">
    import {dataSource} from "$lib/services";
    import OneListing from "$lib/components/OneListing.svelte";
    import {Duration, Box} from "$lib/types";
    import type {LogEntry} from "$lib/services/dataProvider.svelte.js";
    import {resolver} from "$lib/services";
    import {selectiveSubscribe, selectedDate, dateFormatter} from "$lib/services";

    $effect(() => selectiveSubscribe(selectedDate.value));

    interface DisplayData {
        id: number;
        name: string;
        start: Date;
        end: Date;
        time: Duration;
    }

    interface Record {
        id: number
        name: string
        reason: string
    }

    const parsedData_: DisplayData[] = $derived.by(() => {
        if (dataSource.getUniqueNames.length === 0) {
            //? Might this help with reduce being used, and failing, on empty array
            return [];
        }

        const box: Box<DisplayData, Record>[] = dataSource.getUniqueNames.map((name, id) => {
            const f: LogEntry<Date>[] = dataSource.lookup.get(name) || [];

            if (f.length === 0) {
                return Box.error({id, name, reason: "Lookup doesn't exist"});
            }

            /*const a = f.map(item => item.display_name)
            const b = a.filter(item => !!item)

            console.log(a, b);*/

            const distinctNames = new Set<string>();
            for (const one of f) {
                if (one.display_name)
                    distinctNames.add(one.display_name);
            }

            if (distinctNames.size > 1) {
                console.warn(`[Ambiguous] ${name} has mixed labels:`, [...distinctNames]);
                //! If need be, it can error here...
            }

            const resolvedName = distinctNames.values().next().value ?? name;

            const m = f.map(one => new Duration(one.start_time, (one.end_time ?? one.temp_end_time)));

            const {min, max} = f.reduce((acc, curr) => {
                const start = curr.start_time.valueOf();
                const end = (curr.end_time ?? curr.temp_end_time).valueOf();
                return {
                    min: Math.min(acc.min, start),
                    max: Math.max(acc.max, end)
                }
            }, {min: Infinity, max: -Infinity});

            const time = m.reduce((acc, item) => acc.add(item), new Duration()).resync();

            const d: DisplayData = {
                id,
                name: resolvedName,
                start: new Date(min),
                end: new Date(max),
                time
            }

            return Box.ok(d);
        })

        const {values, error} = Box.consumeSafeFull(...box);
        // console.log("values.length: ", values.length);
        if (error) {
            console.warn("Found error: ", error);
        }

        /*const [success, failure] = Box.partition<DisplayData, Record>(...box);
        failure.forEach(
            ({id, name}) => console.warn(`Entry (${id}, ${name}) doesn't have associated data!`)
        );*/

        return values;
    })

    const total: Duration = $derived(
        Duration.from_seconds(
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

    function getPercentage(up: Duration, down: Duration): string {
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
        {#if from !== "uniqueNames"}
            <div>{from}</div>
            <div>{message}</div>
        {/if}
    {:else if sorted.length === 0}
        {@const start = new Date(dataSource.timeRange.start)}
        <div>Nothing to display for {dateFormatter.format(selectedDate.value)}</div>
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