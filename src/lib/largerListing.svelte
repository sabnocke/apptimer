<script lang="ts">
    import {EMPTY_LOG, type LogEntry, fetchData, string2date} from "$lib/services/dataProvider.svelte";
    import {listen} from "@tauri-apps/api/event";
    import {Timing} from "$lib/types/timing";
    import OneDateEntry from "$lib/OneDateEntry.svelte";
    import {ArrowUp, ArrowDown} from "$lib/icons/index";

    import {createVirtualizer, VirtualizerOptions} from "@tanstack/svelte-virtual";

    interface SortingMethods {
        column: "start" | "end",
        order: "oldestFirst" | "newestFirst"
    }

    const DEFAULT = {
        column: "start",
        order: "oldestFirst"
    } as SortingMethods;

    let source = $state(EMPTY_LOG);
    // let curHeight = $state(0);
    let scrollElement: HTMLDivElement = $state({} as HTMLDivElement);
    let self = $state<HTMLDivElement | null>(null);

    let parentHeight = $state(0);
    let sortingMethod = $state<SortingMethods>(DEFAULT);
    let isInFocus = $state< 0 | 1 | 2 | 3 | 4>(0);

    $effect(() => {
        fetchData().then(result => {
            source = result;
        });
    });

    $effect(() => {
        if (!self) return;
        parentHeight = self.parentElement!.offsetHeight;
    })

    listen<LogEntry<string>[]>("activity_change", change => {
        change.payload.forEach(entry => {
            source.push(string2date(entry))
        });
    });



    interface SingleEntry {
        title: string,
        time: Timing
    }

    const display = $derived.by(() => {
        const result: SingleEntry[] = []
        source.forEach(x => {
            const time = new Timing(x.start_time, x.end_time ?? x.temp_end_time);
            const title = x.window_title ? x.window_title : x.process_name;

            result.push({title, time});
        });

        return result;
    });

    const displayable = $derived(display.sort((a, b) => a.time.cmp(b.time, "start")));

    /*type Opts = Partial<VirtualizerOptions<HTMLDivElement, Element>>
    const normalOpts: Opts = {
        // svelte-ignore state_referenced_locally
        count: display.length,
        getScrollElement: () => scrollElement,
        estimateSize: () => 50,
        overscan: 5
    };*/

    /*const virtualizer = createVirtualizer({
        // svelte-ignore state_referenced_locally
        count: displayable.length,
        getScrollElement: () => self,
        estimateSize: () => 50,
        overscan: 5
    });*/

    /*$effect(() => {
        $virtualizer.setOptions({
            count: displayable.length,
            getScrollElement: () => self,
            estimateSize: () => 50,
            overscan: 5
        });
    });*/

    let limit = $state(20);
    const batchSize = 20;

    let visibleItems = $derived(displayable.splice(0, limit));
    function infiniteScroll(node: HTMLDivElement) {
        // const observer;
    }

</script>

<style lang="scss">
    .list {
      display: flex;
      flex-direction: column;
      //grid-template-columns: 2fr 1fr 5px 1fr;
      min-height: 0;
      flex: 1;
      overflow-y: auto;
    }

    .header {
      display: grid;
      grid-template-columns: 2fr 1fr auto 1fr;
      background-color: greenyellow;
      position: sticky;
      left: 0;
      top: 0;

      &__sep {
        width: 2px;
        height: 100%;
        background-color: black;
      }

      &__date {
        text-align: center;
      }

      &__buttons {
        display: flex;
        flex-direction: column;
      }

      &__container {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;

        span {
          text-align: center;
        }
      }
    }


    .btn {
      background: none;
      border: 1px solid black;
      border-radius: 4px;
      height: 24px;
      width: 24px;
      display: inline-flex;
      padding: 0;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      cursor: pointer;

      svg {
        display: block;
      }

      &:hover {
        background-color: white;
      }
    }

</style>

<div class="list" bind:this={self} style:max-height={parentHeight.toString() + "px"}>
    <div class="header">
        <span class="header__title">Name</span>
        <div class="header__container">
            <div class="header__buttons">
                <button class="btn">
                    <ArrowUp fillColor="#000" />
                </button>
                <button class="btn">
                    <ArrowDown fillColor="#000"/>
                </button>
            </div>
            <span class="header__date">Start</span>
            <div></div>
        </div>
        <div class="header__sep"></div>
        <span class="header__date">End</span>
    </div>
    {#each displayable as one, i (i)}
        <OneDateEntry name={one.title} time={one.time} />
    {/each}
    <!--{#each $virtualizer.getVirtualItems() as row, i (i)}-->
    <!--    {@const item = displayable[row.index]}-->
    <!--    <OneDateEntry name={item.title} time={item.time} />-->
    <!--{/each}-->

</div>

