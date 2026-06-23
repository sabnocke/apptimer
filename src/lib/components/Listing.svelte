<script lang="ts">
    import {type DailyAppStat,
        dataSource, dateFormatter, resolver, selectedDate, settings,
        split, group
    } from "$lib/services";
    import OneListing from "$lib/components/OneListing.svelte";
    import {SimpleDuration} from "$lib/types";

    $effect(() => selectedDate.giveSubscribe());

    const total: number = $derived(
        dataSource.data
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

    let sorted = $state<DailyAppStat[]>([]);

    $effect(() => {
        const currentData = dataSource.data;

        (async () => {
            const resolvedData = await Promise.all(
                currentData.map(async (item) => {
                    return {
                        ...item,
                        final_name: await resolver.resolveComplexAsync(item.process_key)
                    };
                })
            );
            sorted = sorting(resolvedData);
        })();
    });

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