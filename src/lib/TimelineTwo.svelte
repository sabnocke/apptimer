<script lang="ts">
    import type {GanttTask, GanttRow} from "$lib/types";
    import {dataSource} from "$lib/services/dataProvider.svelte";

    interface Props {
        rows: GanttRow[];
        columnInterval?: number;
        rowHeight?: number;
        labelWidth?: number;
    }

    $effect(() => {
        return dataSource.subscribe();
    });

    let headerEl = $state({} as HTMLDivElement);
    let bodyEl = $state({} as HTMLDivElement);

    let scrollLeft = $state(0);
    let containerWidth = $state(1000); // Default, updates on mount

    let visibleTasks = $derived.by(() => {
        if (!dataSource.tasks) return [];

        const startPx = scrollLeft - 500;
        const endPx = scrollLeft + containerWidth + 500;

        const startTime = dataSource.timeRange.start + (startPx / zoom) * 1000;
        const endTime = dataSource.timeRange.end + (endPx / zoom) * 1000;

        return dataSource.longestTasks.filter(t => t.to > startTime && t.from < endTime);
    });

    function onResize(node: HTMLElement) {
        const obs = new ResizeObserver(entries => {
            containerWidth = entries[0].contentRect.width;
        });
        obs.observe(node);
        return { destroy: () => obs.disconnect() };
    }

    function handleScroll() {
        if (headerEl && bodyEl) {
            headerEl.scrollLeft = bodyEl.scrollLeft;
        }
    }

    // 1. Zoom Level: Pixels per Second
    let zoom = $state(10);

    // 2. Helper: Convert timestamp to pixel position
    function getPos(time: number) {
        const start = dataSource.timeRange.start;
        const secondsFromStart = (time - start) / 1000;
        return secondsFromStart * zoom;
    }

    //? Adds a buffer (100px for example)
    let totalWidth = $derived(Math.max(1000, (dataSource.timeRange.totalSeconds * zoom) + 200));

    const formatter = Intl.DateTimeFormat("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    })

    // 3. Helper: Format time for the ruler
    function formatTime(ms: number): string {
        return formatter.format(ms);
    }

    // 4. Create Ruler Ticks (every 10 seconds)
    let ticks = $derived.by(() => {
        const range = dataSource.timeRange;
        const result = [];
        // Start at the nearest 10s mark
        let t = Math.floor(range.start / 10_000) * 10_000;

        while (t <= range.end) {
            result.push(t);
            t += 10_000;    // +10 seconds
        }
        return result;
    })


</script>

<div class="timeline-layout">
    <div class="controls">
        <label>Zoom: <input type="range" min="10" max="200" bind:value={zoom} /></label>
        <div class="stats">
            Rendered: {visibleTasks.length} / {dataSource.tasks.length} tasks
        </div>
    </div>

    <div class="grid-header">
        <div class="sidebar-header">Application</div>

        <div class="timeline-window" bind:this={headerEl}>
            <div class="timeline-content" style="width: {totalWidth}px">
                {#each Array.from({ length: Math.ceil(totalWidth / (10 * zoom)) }) as _, i}
                    {@const time = dataSource.timeRange.start + (i * 10000)}
                    <div class="tick" style="left: {getPos(time)}px">
                        {formatter.format(time)}
                    </div>
                {/each}
            </div>
        </div>
    </div>

    <div class="grid-body" use:onResize>
        <div class="timeline-window scrollable" bind:this={bodyEl} onscroll={handleScroll}>

            <div class="rows-container" style="width: {totalWidth}px">
                {#each dataSource.rows as row}
                    <div class="row">
                        <div class="sticky-cell">{row.name}</div>

                        <div class="track">
                            {#each visibleTasks as task (task.id)}
                                {#if task.resourceId === row.id}
                                    <div
                                            class="task-bar"
                                            style="
                                            left: {getPos(task.from)}px;
                                            width: {Math.max(2, getPos(task.to) - getPos(task.from))}px;
                                        "
                                            title="{task.label}"
                                    ></div>
                                {/if}
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<style lang="scss">
  /* LAYOUT */
  .timeline-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #fff;
    font-family: monospace;
    overflow: hidden;
  }

  .controls {
    padding: 8px;
    background: #f8f9fa;
    border-bottom: 1px solid #ddd;
    display: flex;
    justify-content: space-between;
  }

  /* THE GRID STRUCTURE */
  /* We align header and body using CSS variables or identical flex logic */
  .grid-header, .grid-body {
    display: flex;
    flex-direction: column;
  }

  .grid-header {
    display: flex;
    flex-direction: row;
    border-bottom: 1px solid #ccc;
    background: #f1f3f5;
    z-index: 20;
  }

  .grid-body {
    flex: 1;
    overflow: hidden; /* Prevent double scrollbars */
    position: relative;
  }

  /* THE WINDOWS (The parts that scroll) */
  .timeline-window {
    flex: 1;
    overflow-x: hidden; /* Header hides scrollbar */
    position: relative;
  }

  .timeline-window.scrollable {
    overflow: auto; /* Body shows scrollbar */
    height: 100%;
  }

  /* CONTENTS */
  .timeline-content, .rows-container {
    position: relative;
    min-height: 1px; /* Ensure visibility */
  }

  /* ROWS & CELLS */
  .row {
    display: flex;
    border-bottom: 1px solid #eee;
    height: 32px; /* Fixed height for performance */
    align-items: center;
    /* CRITICAL: Ensure the row takes full width */
    min-width: 100%;
  }

  .sidebar-header, .sticky-cell {
    width: 150px;
    min-width: 150px; /* FIXED WIDTH */
    height: 100%;
    display: flex;
    align-items: center;
    padding-left: 8px;
    background: #fff;
    border-right: 1px solid #ddd;

    /* THE STICKY MAGIC */
    position: sticky;
    left: 0;
    z-index: 10;
  }

  .sidebar-header {
    background: #e9ecef;
    font-weight: bold;
    z-index: 30; /* Above sidebar cells */
  }

  .track {
    flex: 1;
    position: relative;
    height: 100%;
  }

  /* ELEMENTS */
  .tick {
    position: absolute;
    bottom: 0;
    padding-left: 4px;
    border-left: 1px solid #ccc;
    height: 20px;
    font-size: 10px;
    color: #666;
  }

  .task-bar {
    position: absolute;
    top: 6px;
    bottom: 6px;
    background: #339af0;
    border-radius: 4px;
    opacity: 0.8;
    /* Performance: Hints to browser to optimize rendering */
    will-change: left, width;

    &:hover {
      opacity: 1;
      z-index: 5;
      background: #228be6;
    }
  }
</style>