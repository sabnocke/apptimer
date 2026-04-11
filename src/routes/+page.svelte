<script lang="ts">
    import {dataSource} from "$lib/services/dataProvider.svelte";
    import {SimpleDuration} from "$lib/types";
    import RadioButtons from "$lib/components/RadioButtons.svelte";
    import {goto} from "$app/navigation";
    import SwitchButton from "$lib/components/SwitchButton.svelte";
    import {setLogging} from "$lib/services";
    import {selectedDate, timeFormatter, dateFormatter} from "$lib/services";
    import Listing from "$lib/components/Listing.svelte";
    import StackedBar from "$lib/components/StackedBar.svelte";

    let before = $state(new Date());
    let today = $derived.by(() => {
        const temp = new Date();
        temp.setDate(temp.getDate() - 6);
        return temp
    });

    $effect(() => selectedDate.giveSubscribe());

    const total = $derived.by(() => {
        return SimpleDuration.fromSeconds(dataSource.timeRange.totalSeconds)
    });

    let allowLogging: boolean = $state(true);
    let isBusy: boolean = $state(false);

    /*async function testPause(): Promise<void> {
        if (isBusy) return;

        isBusy = true;

        try {
            const targetState = !allowLogging;
            console.log(`${allowLogging} -> ${targetState}`);

            allowLogging = targetState;
        } catch (e) {
            console.error(e);
        } finally {
            isBusy = false
        }
    }*/

    async function pause(): Promise<void> {
        if (isBusy) {
            console.log("isBusy is active...");
            return;
        }

        console.log(`[${new Date()}]: pause/resume called from frontend`);

        isBusy = true;

        try {
            const targetState = !allowLogging;
            console.log(`${allowLogging} -> ${targetState}`);

            allowLogging = await setLogging(targetState);
        } catch (e) {
            console.error("Failed: ", e);
        } finally {
            console.log(`[${(new Date()).toISOString()}]: isBusy released`);
            isBusy = false;
        }
    }

    function getFormattedTimeRange(): [string, string, string] {
        if (!dataSource.isEmpty) {
            const first = dateFormatter.format(dataSource.timeRange.start);
            //TODO what to do when start's date != end's date
            const second = timeFormatter.format(dataSource.timeRange.start);
            const third = timeFormatter.format(dataSource.timeRange.end);

            return [first, second, third];
        } else {
            const first = dateFormatter.format(selectedDate.value);
            return [first, "", ""];
        }
    }
</script>

<main class="container">
    <div class="controls grid-container">
        <div class="grid-item-1">
            {#if true}
                {@const [first, second, third] = getFormattedTimeRange()}
                <div class="flex-item">{first}</div>
                {#if second && third}
                    <div class="">{second} - {third}</div>
                {/if}
            {/if}
            <div id="flex-item-4">Total time: {total.format()}</div>
        </div>
        <div class="grid-item-3">
            <div class="flex-container">
                <button onclick={() => selectedDate.dec()}>Previous</button>
                <button onclick={() => selectedDate.setToday()} disabled={selectedDate.isToday}>Today</button>
                <button disabled={selectedDate.isToday} onclick={() => selectedDate.inc()}>Next</button>
            </div>
            <SwitchButton value={allowLogging ? "Pause" : "Resume"} onmousedown={pause} disabled={isBusy}/>
            <div>
                <button onclick={() => goto("/settings")}>Settings</button>
                <button onclick={() => goto("/dataDisplay")}>Data Display</button>
                <button onclick={() => goto("/editorDisplay")}>Editor</button>
            </div>
        </div>
    </div>
    <div class="display">
        <Listing />
        <StackedBar start={today} end={before} />
    </div>
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

  .display {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /*.flex-item {
    display: block;
    width: 80%;

    !*&:nth-child(1) {
      padding-left: 1rem;
      flex: 1 0 50%;
    }*!

    !*&:nth-child(2), &:nth-child(4) {
      flex: 1 1 auto;
    }

    &:nth-child(3) {
      padding-left: 0.25rem;
      padding-right: 0.25rem;
      flex: 0 1 auto;
    }*!
  }*/

  .flex-container {
    display: flex;
  }

  .grid-container {
    //display: grid;
    /*grid-template-rows: 1fr;
    grid-template-columns: 1fr 50% 1fr;
    gap: 0;
    width: 100%;
*/
    .grid-item-1 {
      background-color: rgba(37, 177, 196, 0.5);
      // align-self: start;
      display: flex;
      align-items: center;
      // flex-direction: column;
      justify-content: space-evenly;
    }
    .grid-item-3 {
      padding: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .container {
    display: flex;
    flex-direction: column;

    height: 100dvh;
  }
</style>
