<script lang="ts">
    import {dataSource} from "$lib/services";

    $effect(() => {
        return dataSource.subscribe();
    })

    let {
        select
    }: {
        select: "names" | "data" | null
    } = $props();

    const formatter = Intl.DateTimeFormat("cs-CZ", {
        second: "numeric",
        minute: "numeric",
        hour: "numeric",
        hour12: false,
    });

</script>

{#if select === "names"}
    <div class="names-display">
        {#each dataSource.uniqueNames() as name}
            <div class="one-name">{name}</div>
        {/each}
    </div>
{:else if select === "data"}
    <div class="data-display">
        {#each dataSource.longestTasks as task (task.uid)}
            <div>{task.uid}</div>
            <div>{task.resourceId}</div>
            <div>{formatter.format(task.from)}</div>
            <div>{formatter.format(task.to)}</div>
        {/each}
    </div>
{:else if select === null}
    <div></div>
{:else}
    <div>Unknown select chosen!</div>
{/if}

<style lang="scss">
    .data-display {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
    }
</style>