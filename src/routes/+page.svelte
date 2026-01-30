<script lang="ts">
    import {dataSource} from "$lib/services/dataProvider.svelte";
    import {Duration} from "$lib/types";
    import RadioButtons from "$lib/RadioButtons.svelte";
    import Listing from "$lib/Listing.svelte";
    import {goto} from "$app/navigation";
    import SwitchButton from "$lib/SwitchButton.svelte";
    import {checkAccess, setLogging} from "$lib/services";
    import {onMount} from "svelte";
    import {Temporal} from "@js-temporal/polyfill";
    import {selectiveSubscribe, selectedDate, timeFormatter, dateFormatter} from "$lib/services";
    import Listing2 from "$lib/Listing2.svelte";


    const ALLOW_DEBUG_PRINT: boolean = true;

    /*let isToday: boolean = $derived(selectedDate.getDate() === new Date().getDate());*/

    function dPrint(...src: any[]): void {
        if (ALLOW_DEBUG_PRINT)
            return console.log(...src);
    }

    $effect(() => selectiveSubscribe(selectedDate.value) /*{
        const print = true
        const isToday: boolean = selectedDate.value.toDateString() === new Date().toDateString();
        if (isToday) {
            if (print) console.log("📅 Viewing Today: Starting Real-time Listener...");
            return dataSource.subscribe(false);
        } else {
            if (print) console.log("📅 Viewing Past: Real-time updates disabled.");
            return () => null;
        }
    }*/);

    /*$effect(() => {
        console.log("Listeners: ", dataSource.listeners);
    })*/

    const total = $derived.by(() => {
        return Duration.from_seconds(dataSource.timeRange.totalSeconds)
    });

    let allowLogging: boolean = $state(true);
    let isBusy: boolean = $state(false);

    const today = new Date();

    /*$effect(() => {
        console.log(`allowLogging: ${allowLogging}`);
    });*/ //TODO can be removed

    onMount(async () => {
        try {
            console.log("Finding initial state...");
            allowLogging = await checkAccess();
            console.log("Initial state is: ", allowLogging);
        } catch (e) {
            console.error(e);
        }
    });

    async function testPause(): Promise<void> {
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
    }

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

    function pauseWrapper(): void {
        console.log((new Date()).toISOString(), "Start");
        pause().then();
        console.log((new Date()).toISOString(), "End");
    }

    /*function changeDay(offset: number): void {
        const copy = new Date(selectedDate);

        copy.setDate(copy.getDate() + offset);
        copy.setHours(0, 0, 0, 0);

        selectedDate = copy;
        dataSource.loadSpecific(selectedDate);
    }

    function addDay(): void {
        changeDay(+1);
    }

    function removeDay(): void {
        changeDay(-1)
    }*/

    function getFormattedTimeRange(): [string, string, string] {
        // console.log("dataSource.data: ", $state.snapshot(dataSource.data));
        if (dataSource.data.length !== 0) {
            const first = dateFormatter.format(dataSource.timeRange.start);
            //TODO what to do when start's date != end's date
            const second = timeFormatter.format(dataSource.timeRange.start);
            const third = timeFormatter.format(dataSource.timeRange.end);

            return [first, second, third];
        } else {
            const first = dateFormatter.format(selectedDate.value);
            // console.log("else first: ", first);
            return [first, "", ""];
        }
    }

    /*$effect(() => {
        dPrint(getFormattedTimeRange());
    })*/


</script>

<main class="container">
    <div class="controls grid-container">
        <div class="grid-item-1">
            <div class="sub-flex-1">
                {#if true}
                    {@const [first, second, third] = getFormattedTimeRange()}
                    <div class="flex-item">{first}</div>
                    {#if second && third}
                        <div class="flex-item">{second}</div>
                        <div class="flex-item">-</div>
                        <div class="flex-item">{third}</div>
                    {/if}
                    <!--                <div id="flex-item-1">{formatter.format(dataSource.timeRange.start)}</div>-->
                    <!--                <div id="flex-item-2">-</div>-->
                    <!--                <div id="flex-item-3">{formatter.format(dataSource.timeRange.end)}</div>-->
                {/if}
            </div>
            <div id="flex-item-4">Total time: {total.format()}</div>
            <button onclick={() => goto("/dataDisplay")}>Data Display</button>
        </div>
        <div class="grid-item-2">
            <RadioButtons/>
        </div>
        <div class="grid-item-3">
            <div class="flex-container">
                <button onclick={() => selectedDate.dec()}>Previous</button>
                <button onclick={() => selectedDate.setToday()} disabled={selectedDate.isToday}>Today</button>
                <button disabled={selectedDate.isToday} onclick={() => selectedDate.inc()}>Next</button>
            </div>
            <SwitchButton value={allowLogging ? "Pause" : "Resume"} onmousedown={pause} disabled={isBusy}/>

        </div>
    </div>
    <div class="display">
<!--        <Listing/>-->
        <Listing2 />
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

  /*#flex-item-1, #flex-item-3, #flex-item-4 {
    flex: 1 1 auto;
    text-align: center;
  }

  #flex-item-2 {
    flex: 0 1 auto;
  }*/

  .flex-item {
    display: block;
    width: 80%;

    &:nth-child(1) {
      padding-left: 1rem;
      flex: 1 0 50%;
    }

    &:nth-child(2), &:nth-child(4) {
      flex: 1 1 auto;
    }

    &:nth-child(3) {
      padding-left: 0.25rem;
      padding-right: 0.25rem;
      flex: 0 1 auto;
    }
  }

  .flex-container {
    display: flex;
  }

  .grid-container {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr 50% 1fr;
    gap: 0;
    width: 100%;

    .grid-item-1 {
      background-color: rgba(37, 177, 196, 0.5);
      align-self: start;
      display: flex;
      align-items: center;
      flex-direction: column;
      margin-top: 0.5rem;
    }

    .grid-item-2 {
      //grid-area: 1/2/2/3;
      background-color: rgba(156, 120, 64, 0.5);
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    .grid-item-3 {
      padding: 0.5rem;
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
