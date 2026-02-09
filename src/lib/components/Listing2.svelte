<script lang="ts">
    import {dataSource, dateFormatter, resolver, selectedDate, selectiveSubscribe, timeFormatter} from "$lib/services";
    import OneListing from "$lib/components/OneListing.svelte";
    import {type AppStats, Duration} from "$lib/types";

    $effect(() => {
        dataSource.altLoadSpecific(new Date(), false).then()
        const interval = setInterval(() => {
                dataSource.altLoadSpecific(new Date(), true).then()
        }, 5000);

        return () => clearInterval(interval);
    });

    const total: number = $derived(
        dataSource.data2
            .map(item => item.total_seconds)
            .reduce((acc, item) => acc + item, 0)
    );

    const sorted: AppStats[] = $derived(
        dataSource.data2.toSorted((a, b) => {
            return b.total_seconds - a.total_seconds;
        })
    );

    function getPercentage(up: number): string {
        if (total === 0) return "0%";
        return (up / total * 100).toFixed(2) + "%";
    }

    /*$effect(() => {
        console.log(dataSource.loading);
        console.log($state.snapshot(dataSource.data2));
        console.log($state.snapshot(sorted));
        console.log($state.snapshot(total));
    })*/

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
        {#each sorted as {final_name, process_key, total_seconds} (process_key)}
            {@const timed = Duration.format_seconds(total_seconds)}

            <OneListing
                name={resolver.resolve(final_name)}
                time={timed}
                percentage={getPercentage(total_seconds)}
            />
        {/each}
        <div>{Duration.format_seconds(total)}</div>
    {:else}
        <div>LOADING</div>
    {/if}
</div>

<style>
    .display {
        overflow-y: scroll;
        max-height: 300px;
    }
</style>