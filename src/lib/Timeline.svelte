<script lang="ts">
    import {MomentSvelteGanttDateAdapter, SvelteGantt, SvelteGanttTable} from 'svelte-gantt/svelte';
    // import 'svelte-gantt/svelteGantt.css'; // <--- CRITICAL FIX
    import moment from "moment";
    import {EMPTY_LOG, fetchData} from "$lib/services/dataProvider.svelte";
    // import Gantt from 'frappe-gantt';

    let source = $state(EMPTY_LOG);

    $effect(() => {
        fetchData().then(result => source = result);
    });

    // 1. Prepare Rows
    let rows = $derived.by(() => {
        const uniqueNames = [...new Set(source.map(x => x.process_name))];
        return uniqueNames.map((x, idx) => ({
            id: idx,
            label: x, // This must match the 'property' in tableHeaders below
        }));
    });

    interface Task {
        id: number,
        resourceId: number,
        from: number,
        to: number,
        html: string,
        classes: string
    }

    // 2. Prepare Tasks
    let tasks = $derived.by(() => {
        if (!rows.length) return [];
        return source.map((x, idx) => {
            const row = rows.find(r => r.label === x.process_name);
            return {
                id: idx,
                resourceId: row!.id,
                // Tooltip to show name on hover
                html: `<div style="width:100%; height:100%" title="${x.process_name}"></div>`,
                from: x.start_time.valueOf(),
                to: (x.end_time ?? x.temp_end_time).valueOf(),
                classes: "task-item"
            }
        });
    });

    let groupedTasks = $derived.by(() => {
        const uniqueResourceIds = [...new Set(tasks.map(x => x.resourceId))];
        const result: Map<number, (typeof tasks)> = new Map();
        for (const id of uniqueResourceIds) {
            const items = tasks.filter(x => x.resourceId === id);
            result.set(id, items);
        }

        return result;
    });

    function getLongestChains(source: Task[]) {
        if (source.length === 0) return [];
        if (source.length === 1) return [ ...source ];

        const chains: Task[] = [];

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

    let longestTasks = $derived.by(() => {
        const connection: Map<number, Task[]> = new Map();
        for (const entry of groupedTasks.entries()) {
            const key = entry[0];
            const value = entry[1];
            connection.set(key, getLongestChains(value));
        }

        return connection;
    });

    $effect(() => {
        // console.log($state.snapshot(rows));
        console.log($state.snapshot(tasks));
        // console.log($state.snapshot(groupedTasks))
        const tt = [ ...$state.snapshot(longestTasks).values() ].flat();
        console.log(tt);
    })

    // 3. Time Ranges
    let timeRange = $derived.by(() => {
        if (!tasks.length) return { from: 0, to: 0 };
        const times = tasks.flatMap(t => [t.from, t.to]);
        return { from: Math.min(...times), to: Math.max(...times) };
    });

    // 4. Options
    let options = $derived({
        dateAdapter: new MomentSvelteGanttDateAdapter(moment),
        fitWidth: true,
        minWidth: 800,
        columnUnit: 'hour',
        columnWidth: 1,
        headers: [
            { unit: "minute", format: "HH:mm", increment: 10 },
            // { unit: "second", format: "ss", increment: 10 }
        ],
        // View settings
        from: timeRange.from,
        to: timeRange.to /*Math.min(timeRange.to, timeRange.from + (5 * 60 * 1000))*/,
        rows: rows,
        tasks: [ ...longestTasks.values() ].flat(),
        enableCreateTasks: false,
        enableCreateDependency: false,
        tableWidth: 200,
        tableHeaders: [
            { title: 'Team', property: 'label', width: 200 }
        ],
        ganttTableModules: [SvelteGanttTable],

    });

    // 5. Sidebar Config (Defined explicitly to ensure it loads)
    const tableHeaders = [{ title: "Application", property: "label", width: 140 }];
</script>

<div class="container">
    <SvelteGantt {...options}>
    </SvelteGantt>
</div>

<style>
    .container {
        height: 100vh;
        width: 100%;
        position: relative;
    }

    /* Add basic Gantt styling */
    :global(.sg-gantt) {
        display: flex;
        width: 100%;
        height: 100%;
    }

    :global(.sg-table) {
        display: flex;
        flex-direction: column;
        background: white;
        border-right: 1px solid #e0e0e0;
    }

    :global(.sg-table-row) {
        display: flex;
        align-items: center;
        padding: 0 12px;
        background: white;
        border-bottom: 1px solid #efefef;
        height: 52px;
    }

    :global(.sg-timeline) {
        flex: 1;
        overflow: auto;
    }

    :global(.task-item) {
        background-color: #74c0fc;
        border-radius: 4px;
    }
</style>