<script lang="ts">
    import {dataSource} from "$lib/services/dataProvider.svelte";
    import {Timing} from "$lib/types";
    import RadioButtons from "$lib/RadioButtons.svelte";
    import Listing from "$lib/Listing.svelte";
    import {goto} from "$app/navigation";
    import SwitchButton from "$lib/SwitchButton.svelte";
    import {checkAccess, setLogging} from "$lib/services";
    import {onMount} from "svelte";

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

    let allowLogging: boolean = $state(true);
    let isBusy: boolean = $state(false);

    $effect(() => {
        console.log(`allowLogging: ${allowLogging}`);
    })

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




</script>

<main class="container">
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
        <div class="grid-item-3">
            <SwitchButton value={allowLogging ? "Pause" : "Resume"} onmousedown={pause} disabled={isBusy}/>
        </div>
    </div>
    <div class="display">
        <Listing />
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
      //grid-area: 1/1/2/2;
      background-color: rgba(37, 177, 196, 0.5);
      align-self: start;
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
