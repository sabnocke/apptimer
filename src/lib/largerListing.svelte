<script lang="ts">
    import {EMPTY_LOG, type LogEntry, fetchData, string2date} from "$lib/services/dataProvider.svelte";
    import {listen} from "@tauri-apps/api/event";
    // import {Timing} from "$lib/types/timing";
    import {Timing, type SingleEntry} from "$lib/types";
    import OneDateEntry from "$lib/OneDateEntry.svelte";
    import {ArrowUp, ArrowDown} from "$lib/icons/index";
    // import VirtualList from "@sveltejs/svelte-virtual-list/VirtualList.svelte";
    // import SvelteVirtualList from "@humanspeak/svelte-virtual-list";
    // import type {numberlike} from "moment";
    import Virtualizer from "$lib/Virtualizer.svelte";
    import { SvelteGantt, type SvelteGanttOptions, MomentSvelteGanttDateAdapter } from "svelte-gantt/svelte";
    import {mount, unmount} from "svelte";
    import moment from "moment";

    // import {createVirtualizer, VirtualizerOptions} from "@tanstack/svelte-virtual";

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
    let gantt: SvelteGantt | null = null;
    let container: HTMLDivElement;

    let parentHeight = $state(0);

    type NumberOrder = 0 | 1 | 2 | 3 | 4;

    let isInFocus = $state<NumberOrder>(1);

    let sorting = new Map<NumberOrder, (a: SingleEntry, b: SingleEntry) => number>()
    sorting.set(0, (a, b) => a.time.cmp(b.time, "start"));      // default
    sorting.set(1, (a, b) => a.time.cmp(b.time, "start"));      // start && oldestFirst
    sorting.set(2, (a, b) => a.time.cmp(b.time, "start", "d")); // start && newestFirst
    sorting.set(3, (a, b) => a.time.cmp(b.time, "end"));        // end && oldestFirst
    sorting.set(4, (a, b) => a.time.cmp(b.time, "end", "d"));   // end && newestFirst

    $effect(() => {
        fetchData().then(result => {
            source = result;
        });
    });

    $effect(() => {
        if (!self) return;
        parentHeight = self.parentElement!.offsetHeight;
    })

    // listen<LogEntry<string>[]>("activity_change", change => {
    //     change.payload.forEach(entry => {
    //         source.push(string2date(entry))
    //     });
    // });

    const display = $derived.by(() => {
        const result: SingleEntry[] = []
        source.forEach((x, index) => {
            const time = new Timing(x.start_time, x.end_time ?? x.temp_end_time);
            const title = x.window_title ? x.window_title : x.process_name;

            result.push({id: index, title, time});
        });

        return result;
    });

    let limit = $state(50);
    const batchSize = 50;

    let visibleItems = $derived(display.sort(sorting.get(isInFocus)!).splice(0, limit));
    let displayable = $derived(display.sort(sorting.get(isInFocus)!));

    let rows = $derived.by(() => {
        const uniqueNames = [...new Set(source.map(x => x.process_name))];
        return uniqueNames.map((x, idx) => ({
            id: idx,
            label: x,
        }));
    });

    let tasks = $derived.by(() => {
        return source.map((x, idx) => {
            const rowId = rows.find(r => r.label === x.process_name)!.id;

            /*if (!rowId) {
                console.warn(`(${x.window_title}, ${idx}) is missing in rows.`)
                return
            }*/

            return {
                id: idx,
                resourceId: rowId,
                label: "",
                html: `<div title="${x.process_name}"></div>`,
                from: x.start_time.valueOf(),
                to: (x.end_time ?? x.temp_end_time).valueOf()
            }
        });
    });

    const allTimes = $derived(tasks.flatMap(x => [x.from, x.to]));
    const minTime = $derived(Math.min(...allTimes));
    const maxTime = $derived(Math.max(...allTimes));
    const fiveMinutes = 5 * 60 * 1000;

    let options: SvelteGanttOptions = $derived({
        rows: rows,
        tasks: tasks,
        from: minTime,
        to: Math.min(maxTime, fiveMinutes + minTime),

        fitWidth: false,
        minWidth: 800,
        dateAdapter: new MomentSvelteGanttDateAdapter(moment),

        headers: [
            {unit: "minute", format: "HH:mm", sticky: true},
            {unit: "second", format: "ss", increment: 10}
        ],

        tableHeaders: [{title: "Application", property: "label", width: 140}],
        tableWidth: 150,

        columnUnit: "second",
        columnOffset: 40,
    })

    /*$effect(() => {
        if (!container || !rows.length) return;

        const allTimes = tasks.flatMap(x => [x.from, x.to]);
        const minTime = Math.min(...allTimes);
        const maxTime = Math.max(...allTimes);

        if (gantt) unmount(gantt)

        gantt = mount(SvelteGantt, {
            target: container,
            props: {
                rows: rows,
                tasks: tasks,
                from: minTime,
                to: maxTime,

                // dateAdapter: new MomentSvelteGanttDateAdapter()
                fitWidth: true,
                minWidth: 800,

                headers: [{unit: "minute", format: "HH:mm"}],
                // tableHeaders
                tableWidth: 150,
                columnOffset: 1
            }
        })
    })*/

    function infiniteScroll(node: HTMLDivElement) {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && limit < display.length) {
                limit += batchSize;
            }
        }, {
            rootMargin: "200px"
        });

        observer.observe(node)

        return {
            destroy() {
                observer.disconnect();
            }
        };
    }

    function switchFocus(newFocus: NumberOrder): void {
        if (newFocus === isInFocus) {
            isInFocus = 1;
        } else {
            isInFocus = newFocus;
        }
    }

</script>

<style lang="scss">
    .list {
      //display: flex;
      //flex-direction: column;
      //min-height: 0;
      //flex: 1;
      //overflow-y: auto;
    }

    .header {
      display: grid;
      grid-template-columns: 2fr 1fr auto 1fr;
      background-color: greenyellow;
      position: sticky;
      left: 0;
      top: 0;
      z-index: 1;
      height: 30px;

      &__sep {
        width: 2px;
        height: 100%;
        background-color: black;
      }

      &__date {
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      &__container {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        place-items: center;

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

      &:hover {
        background-color: white;
      }
    }

    .focused {
      background-color: white;
    }

    .loading-trigger {
      padding: 20px;
      text-align: center;
      color: #888;
    }

</style>

<div class="list" bind:this={self} style:max-height={parentHeight.toString() + "px"}>
<!--    <div class="header">-->
<!--        <span class="header__title">Name</span>-->
<!--        <div class="header__container">-->
<!--            <button class="btn"-->
<!--                    onclick={() => switchFocus(1)}-->
<!--                    class:focused={isInFocus === 1}-->
<!--            >-->
<!--                <ArrowUp fillColor="#000"/>-->
<!--            </button>-->
<!--            <span class="">Start</span>-->
<!--            <button class="btn"-->
<!--                    onclick={() => switchFocus(2)}-->
<!--                    class:focused={isInFocus === 2}-->
<!--            >-->
<!--                <ArrowDown fillColor="#000"/>-->
<!--            </button>-->
<!--            <div></div>-->
<!--        </div>-->
<!--        <div class="header__sep"></div>-->
<!--        <span class="header__date">End</span>-->

<!--    </div>-->
    <!--{#each visibleItems as one, i (i)}-->
    <!--    <OneDateEntry name={one.title} time={one.time} />-->
    <!--{/each}-->

    <!--{#if limit < display.length}-->
    <!--    <div use:infiniteScroll class="loading-trigger">-->
    <!--        Loading more...-->
    <!--    </div>-->
    <!--{:else if limit >= display.length}-->
    <!--    <div>-->
    <!--        Nothing more to show...-->
    <!--    </div>-->
    <!--{/if}-->
<!--    <Virtualizer items={displayable} itemHeight={24} key={item => item.id}>-->
<!--        {#snippet children(item, _)}-->
<!--            <OneDateEntry name={item.title} time={item.time} />-->
<!--        {/snippet}-->
<!--    </Virtualizer>-->
<!--    <div>-->
<!--        <SvelteGantt {...options}></SvelteGantt>-->
<!--    </div>-->
</div>

