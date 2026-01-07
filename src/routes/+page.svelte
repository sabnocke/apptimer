<script lang="ts">
    import {dataSource} from "$lib/services/dataProvider.svelte";
    import {Timing} from "$lib/types";
    import RadioButtons from "$lib/RadioButtons.svelte";
    import TimelineTwo from "$lib/TimelineTwo.svelte";
    import Listing from "$lib/Listing.svelte";
    import Loader from "$lib/Loader.svelte";
    import {goto} from "$app/navigation";
    import {onMount} from "svelte";

    /*onMount(() => {
        dataSource.load();
    })*/

    $effect(() => {
        return dataSource.subscribe();
    })

    const total = $derived.by(() => {
        return Timing.from_seconds(dataSource.timeRange.totalSeconds)
    });



    const formatter = Intl.DateTimeFormat("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
        weekday: "short",
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour12: false
    });

    $effect(() => {
        console.log(dataSource.loading.allSet);
    });

</script>

<main class="container">
    {#if dataSource.loading.allSet}
        <div>
            <div class="viewer-place">
                <button onclick={() => goto("/dataDisplay")}>Data Display</button>
            </div>
            <Loader />
        </div>
    {:else if dataSource.error}
        <div>{dataSource.error}</div>
    {:else}
        <div class="controls grid-container">
            <div class="grid-item-1">
                <div class="sub-flex-1">
                    <div id="flex-item-1">{formatter.format(dataSource.timeRange.start)}</div>
                    <div id="flex-item-2">-</div>
                    <div id="flex-item-3">{formatter.format(dataSource.timeRange.end)}</div>
                </div>
                <div id="flex-item-4">Total time: {total.format()}</div>
                <button onclick={() => goto("/dataDisplay")}>Data Display</button>
            </div>
            <div class="grid-item-2"><RadioButtons /></div>
        </div>
        <div class="display">
            <TimelineTwo />
            <Listing />
        </div>
    {/if}
</main>

<style lang="scss">
  :root {
    font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 24px;
    font-weight: 400;

    color: #0f0f0f;
    background-color: #f6f6f6;

    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;

    margin: 0;
  }

  :global(html, body) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }

  .controls {
    height: 20%;
  }

  .display {
    height: 80%;
    width: 100%;
  }

  .sub-flex-1 {
    display: flex;
    align-items: center;
  }

  #flex-item-1, #flex-item-3, #flex-item-4 {
    flex: 1 1 auto;
    text-align: center;
  }

  #flex-item-2 {
    flex: 0 1 auto;
  }

  .grid-container {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr 50% 1fr;
    gap: 0;
    width: 100%;

    .grid-item-1 {
      grid-area: 1/1/2/2;
      background-color: rgba(37, 177, 196, 0.5);
      align-self: start;
    }

    .grid-item-2 {
      grid-area: 1/2/2/3;
      background-color: rgba(156, 120, 64, 0.5);
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
  }

  .container {
    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;
    height: 100dvh;
  }

  .viewer-place {
    position: absolute;
    left: 0;
    top: 0;
  }
</style>
