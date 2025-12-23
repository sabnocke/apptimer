<script lang="ts">
    import {dataSource} from "$lib/services/dataProvider.svelte";
    import { type GanttTask, type GanttRow, SuperMap} from "$lib/types";
    import {createPathMap} from "$lib/services/utils";
    import RadioButtons from "$lib/RadioButtons.svelte";
    import TimelineTwo from "$lib/TimelineTwo.svelte";
    import { onMount } from "svelte";

    /*$effect(() => {
        const unsubscribe = dataSource.subscribe();
        // console.log(dataSource.intervalId);
        return unsubscribe;
    });*/

    /*onMount(() => {
        return dataSource.subscribe();
    })*/

    const pathMap = createPathMap(["Graph", "#"], ["List", "./listing"]);

    /*function getLongestChains(source: GanttTask[]) {
        if (source.length === 0) return [];
        if (source.length === 1) return [...source];

        const chains: GanttTask[] = [];

        let currentChain = {...source[0]};
        for (const nextTask of source) {
            if (currentChain === nextTask) continue;

            if (currentChain.to === nextTask.from) {
                currentChain.to = nextTask.to
            } else {
                chains.push(currentChain);
                currentChain = {...nextTask};
            }
        }

        chains.push(currentChain);

        return chains[0].id === chains[1].id ? chains.slice(1, -1) : chains;
    }*/


    /*let tasks = $derived.by<GanttTask[]>(() => {
        if (dataSource.length === 0) return [];

        return dataSource.map<GanttTask>((x, idx) => {
            return {
                id: idx,
                label: x.process_name,
                from: x.start_time,
                to: x.end_time ?? x.temp_end_time
            };
        });
    });*/

    // let task_map = $derived.by(() => Map.groupBy<string, GanttTask>(tasks, item => item.label));
    // const task_map = $derived(SuperMap.groupBy(tasks, item => item.label));

    /*$effect(() => {
        console.log("task_map", task_map);
    })*/

    /*let rows = $derived.by<GanttRow[]>(() => {
        if (dataSource.length === 0) return [];

        return dataSource
            .uniqueNames()
            .map<GanttRow>((x, idx) => {
                const longestTasks = getLongestChains(task_map.fetch(x).unwrapOr([]))
                // console.log(longestTasks);
                return {
                    id: idx,
                    label: x,
                    tasks: longestTasks
                }
            });
    });*/

    /*$effect(() => {
        console.log(tasks, getLongestChains(tasks));
        console.log();
    })*/

</script>

<main class="container">
    <div class="controls">
        <RadioButtons names={pathMap} active="Graph" />
    </div>
    <div class="display">
        <TimelineTwo />
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

  .container {
    //padding: 0 !important;
    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;
    //margin: 10px;
    height: 100dvh;
    //width: 100dvw;
    //overflow: hidden;
  }
</style>
