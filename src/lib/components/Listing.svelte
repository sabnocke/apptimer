<script lang="ts">
    import {type DailyAppStat,
        dataSource, dateFormatter, resolver, selectedDate, settings,
        split, group
    } from "$lib/services";
    import OneListing from "$lib/components/OneListing.svelte";
    import {SimpleDuration} from "$lib/types";

    $effect(() => selectedDate.giveSubscribe());

    const total: number = $derived(
        dataSource.data_
            .map(item => item.total_seconds)
            .reduce((acc, item) => acc + item, 0)
    );

    function compare(a: DailyAppStat, b: DailyAppStat): number {
        return b.total_seconds - a.total_seconds;
    }

    function sorting(src: DailyAppStat[]): DailyAppStat[] {
        let fin = settings.aggregate_group() ? group(src) : src;
        let [valid, invalid] = split(fin, item => !resolver.invalid_names.includes(item.final_name))
        if (!settings.show_unknown)
            invalid = invalid.filter(item => item.final_name != "UNKNOWN");
        if (!settings.show_group)
            invalid = invalid.filter(item => item.final_name != "Idle/System");
        return [
            ...valid.sort(compare),
            ...invalid.sort(compare)
        ];
    }



    /*function group(src: DailyAppStat[]): DailyAppStat[] {
        const agg: DailyAppStat = {
            day: src[0]?.day || "",
            final_name: "Idle/System",
            process_key: "obfuscated",
            total_seconds: 0,
            session_count: 0
        };

        const result = reduce_if(src,
            (item) => item.final_name === "Idle/System",
            (acc, item) => {
                return {
                    ...acc,
                    total_seconds: acc.total_seconds + item.total_seconds,
                    session_count: acc.session_count + item.session_count
                }
            }, agg
        )

        const fin = src.filter(item => item.final_name != "Idle/System");

        return [...fin, result];
    }*/

    const sorted = $derived.by(() => {
        let source = dataSource.data_.map<DailyAppStat>(item => {
            return {
                ...item,
                final_name: resolver.resolveComplex(item.process_key)
            }
        });
        return sorting(source);
    })

    function getPercentage(up: number): string {
        if (total === 0) return "0%";
        return (up / total * 100).toFixed(2) + "%";
    }

</script>

<div class="display">
    {#if dataSource.isErrorSet}
        {@const {from, message} = dataSource.error}
        {#if from !== "uniqueNames"}
            <div>{from}</div>
            <div>{message}</div>
        {/if}
    {:else if sorted.length === 0}
        <div>Nothing to display for {dateFormatter.format(selectedDate.value)}</div>
    {:else if sorted.length > 0}
        {#each sorted as {final_name, process_key, total_seconds} (final_name)}
            {@const timed = SimpleDuration.format_seconds(total_seconds)}

            <OneListing
                name={final_name}
                time={timed}
                percentage={getPercentage(total_seconds)}
            />
        {/each}
    {:else}
        <div>LOADING</div>
    {/if}
</div>

<style>
    .display {
        overflow-y: scroll;
        max-height: 300px;
        flex: 1 0 auto;
        padding-top: 1rem;
        border-top: 1px solid black;
    }
</style>