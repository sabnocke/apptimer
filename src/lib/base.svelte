<script lang="ts">
    //! pending destruction

    import Listing from "./listing.svelte";
    import RadioButtons from "$lib/RadioButtons.svelte";
    import LargerListing from "$lib/largerListing.svelte";
    import Timeline from "$lib/Timeline.svelte";
    import TimelineTwo from "$lib/TimelineTwo.svelte";
    import {EMPTY_LOG, fetchData} from "$lib/services/dataProvider.svelte";
    import type {GanttRow, GanttTask} from "$lib/types";

    let source = $state(EMPTY_LOG);

    $effect(() => {
        const int = setInterval(() => {
            fetchData().then(r => source = r);
        }, 1000);

        return () => clearInterval(int);
    });

    /*let task_map: Map<string, GanttTask[]> = $derived.by(() => {
        const map = new Map<string, GanttTask[]>();
        const snapshot = $state.snapshot(source);
        const uniqueRowNames = new Set(snapshot.map(x => x.process_name));
        for (const name of uniqueRowNames) {
            const tasks = snapshot
                .filter(x => x.process_name === name)
                .map((x, idx) => ({
                    id: idx,
                    label: x.process_name,
                    start: x.start_time,
                    end: x.end_time ?? x.temp_end_time
                }));
            map.set(name, tasks);
        }

        return map;
    });*/

    function getLongestChains(source: GanttTask[]) {
        if (source.length === 0) return [];
        if (source.length === 1) return [ ...source ];

        const chains: GanttTask[] = [];

        let currentChain = {...source[0]};
        for (const nextTask of source) {
            if (currentChain === nextTask) continue;

            if (currentChain.to === nextTask.from) {
                currentChain.to = nextTask.to
            } else {
                chains.push(currentChain);
                currentChain = { ...nextTask };
            }
        }

        chains.push(currentChain);

        return chains[0].id === chains[1].id ? chains.slice(1, -1) : chains;
    }

    let tasks = $derived.by<GanttTask[]>(() => {
        if (source.length === 0) return [];

        return source.map((x, idx) => {
            return {
                id: idx,
                label: x.process_name,
                from: x.start_time,
                to: x.end_time ?? x.temp_end_time
            };
        });
    });

    let task_map = $derived.by(() => {
        return Map.groupBy<string, GanttTask>(tasks, (item) => {
            return item.label;
        });
    });

    $effect(() => {
        console.log(tasks, getLongestChains(tasks));
        console.log();
    })

    let rows = $derived.by<GanttRow[]>(() => {
        if (source.length === 0) return [];

        const uniqueRowNames = new Set(source.map(x => x.process_name));
        return [...uniqueRowNames].map((x, idx) => {
            return {
                id: idx,
                label: x,
                tasks: task_map.get(x) ?? [],
            };
        });
    });

    /*$effect(() => {

    })

    let tasks = $derived.by<GanttRow[]>(() => {
        let app_tasks: Map<number, GanttTask[]> = new Map();
        let uniqueRowsNames = new Set(rows.map(x => x.label));
        uniqueRowsNames.forEach((name, idx) => {
            const connIdx = rows.findIndex(x => x.label === name);
            const coll = source.filter(x => x.process_name === name);
            const proto_tasks = coll.map<GanttTask>((x, idx) => {
                return {
                    id: idx,
                    label: x.process_name,
                    start: x.start_time,
                    end: x.end_time ?? x.temp_end_time,
                }
            });
            if (connIdx !== -1) {
                rows[connIdx].tasks = proto_tasks;
            }
        })
    })*/
    
    /*interface Props {
      minTopRowHeight: number,
      minLeftColWidth: number
    }

    let {
      minTopRowHeight = 300,
      minLeftColWidth = 450
    }: Props = $props();

    let isResizingVertical = $state(false);
    let isResizingHorizontal = $state(false);

    let lowerRowRightHeight = $state(0);

    const DEFAULT = {} as HTMLDivElement;

    let centralContainer = $state<HTMLDivElement>(DEFAULT);
    let leftCol = $state<HTMLDivElement>(DEFAULT);
    let topRow = $state<HTMLDivElement>(DEFAULT);*/

    /*function resetTopRow() {
      document.documentElement.style.setProperty("--top-row-height", "1fr");
    }

    function resetLeftCol() {
      document.documentElement.style.setProperty("--left-col-width", "1fr");
    }*/

    /*function resizeLeftCol(event: MouseEvent) {
      if (!isResizingVertical) return;

      const newWidth = event.clientX - leftCol.offsetLeft;

      if (newWidth > 0 &&
          newWidth < centralContainer.offsetWidth &&
          (centralContainer.offsetWidth - newWidth) > minLeftColWidth
      ) {
        document.documentElement.style.setProperty("--left-col-width", `${newWidth}px`);
      }
    }

    function resizeTopRow(event: MouseEvent) {
      if (!isResizingHorizontal) return;

      const newHeight = event.clientY - topRow.offsetTop;

      if (newHeight > 0 &&
          newHeight < centralContainer.offsetHeight &&
          (centralContainer.offsetHeight - newHeight) > minTopRowHeight
      ) {
        document.documentElement.style.setProperty("--top-row-height", `${newHeight}px`);
      }
    }*/

    /*document.addEventListener("mousemove", resizeTopRow);
    document.addEventListener("mousemove", resizeLeftCol);
    document.addEventListener("mouseup", () => {
      isResizingHorizontal = false;
      isResizingVertical = false;
    })*/

    let selectedButton = $state("graph");
    let namesList = $state(["graph", "list"]);
    let referredName = $state("");

    /*$effect(() => {
        console.log(selectedButton);
        console.log(referredName);
    });*/

</script>

<div class="controls">
    <RadioButtons names={namesList} bind:active={selectedButton}/>
    Control
</div>
{#if selectedButton === "list"}
    <div class="display">
        <Listing/>
    </div>
{:else if selectedButton === "graph"}
    <div class="display">
<!--        <Timeline/>-->
        <TimelineTwo rows={rows} />
    </div>
{/if}


<style lang="scss">
  @use "sass:color";

  :global(body) {
    padding: 0;
    margin: 0;
  }

  /*:root {
    --left-col-width: 1fr;
    --top-row-height: 1fr;
  }*/

  /*.grids {
    display: grid;
    grid-template-rows: var(--top-row-height) 1rem 1fr;
    width: 100%;
    height: 100%;
  }

  $btn-offset: 0.5rem;

  .td-resizer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    align-content: center;
    padding-left: $btn-offset;
    padding-right: $btn-offset;
  }

  .lr-resizer {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-content: center;
    align-items: center;
    padding-top: $btn-offset;
    padding-bottom: $btn-offset;
  }

  $btn-bg-color: #818589;

  .btn-td-resizer {
    width: 100%;
    height: 0.75rem;
    background-color: $btn-bg-color;
    border: none;
    border-radius: 100px;

    cursor: n-resize;

    &:hover {
      background-color: color.adjust($btn-bg-color, $lightness: 20%);
    }
  }

  .btn-lr-resizer {
    height: 100%;
    width: 0.75rem;
    background-color: $btn-bg-color;
    border: none;
    border-radius: 100px;

    cursor: e-resize;

    &:hover {
      background-color: color.adjust($btn-bg-color, $lightness: 20%);
    }
  }

  .topRow {
    background-color: rgba(26, 186, 63, 0.5);
  }

  .left {
    background-color: rgba(62, 188, 197, 0.5);
  }

  .right {
    background-color: rgba(32, 10, 154, 0.5);
    padding-top: 1rem;
    padding-left: 1rem;
    padding-right: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    height: 100%;
    min-height: 0;
  }

  .bottomRow {
    display: grid;
    grid-template-columns: var(--left-col-width) 1rem 1fr;
  }*/

  .controls {
    height: 20%;
  }

  .display {
    height: 80%;
    width: 100%;
  }

</style>