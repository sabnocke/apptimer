<script lang="ts">
    import {dataSource} from "$lib/services/dataProvider.svelte";
    import {resolver} from "$lib/services/nameResolver.svelte";
    import type {Action} from "svelte/action";
    import type {Attachment} from "svelte/attachments";

    $effect(() => {
        return dataSource.subscribe(false);
    });

    let zoom = $state(40);
    let containerWidth = $state(1000);

    let scrollTop = $state(0);
    let scrollLeft = $state(0);

    let secondsPerTick = $state(10);

    let rowsWrapperHeight = $state(0);

    let staticHeader = $state({} as HTMLDivElement);
    let sidebarWidth = $state(0);
    let tickWidth = $state(0);
    let headerCharWidth = $state(0);

    let range = $derived(dataSource.timeRange || {start: 0, end: 1000, totalSeconds: 1});
    let totalWidth = $derived(
        Math.max(containerWidth, ((range.end - range.start) / 1000) * zoom) + 200
    );

    let visibleTasks = $derived.by(() => {
        if (!dataSource.longestTasks) return [];

        const bufferPx = containerWidth;

        const startPx = Math.max(scrollLeft - bufferPx);
        const endPx = scrollLeft + containerWidth + bufferPx;

        const startTime = range.start + (startPx / zoom) * 1000;
        const endTime = range.start + (endPx / zoom) * 1000;

        // Keep tasks if it overlaps with the window:
        // (task ends after window starts) and (task starts before window ends)
        return dataSource.longestTasks.filter(t => t.to > startTime && t.from < endTime);
    });

    let visibleTicks = $derived.by(() => {
        const msTick = secondsPerTick * 1000;

        const startPx = Math.max(0, scrollLeft - 200);
        const endPx = scrollLeft + containerWidth + 200;

        const startTime = range.start + (startPx / zoom) * 1000;
        const endTime = range.start + (endPx / zoom) * 1000;

        let t = Math.floor(startTime / msTick) * msTick;
        const ticks = [];

        while (t <= endTime) {
            ticks.push(t);
            t += 10_000;
        }

        return ticks;
    });

    const formatter = new Intl.DateTimeFormat("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    function getPos(time: number): number {
        if (!range.start) return 0;
        return ((time - range.start) / 1000) * zoom;
    }

    let headerEl: HTMLDivElement;
    let bodyEl: HTMLDivElement;

    function handleGlobalWheel(e: WheelEvent) {

        const isHeaderHover = (e.target as HTMLElement).closest(".header-container");
        const isHorizontalIntent = e.shiftKey || e.ctrlKey || isHeaderHover;

        if (isHorizontalIntent) {
            e.preventDefault();

            // Map vertical wheel (deltaY) to horizontal scroll
            // Note: e.deltaY is usually 100 or -100. We can speed it up with a multiplier.
            const speed = 1.5;
            const delta = (e.deltaY || e.deltaX) * speed;

            // Apply to our state object (which binds to the DOM)
            if (bodyEl) {
                bodyEl.scrollLeft += delta;
            }
        }
    }

    function handleNativeScroll(e: Event) {
        const target = e.target as HTMLDivElement;
        scrollLeft = target.scrollLeft;
        scrollTop = target.scrollTop;

        if (headerEl) headerEl.scrollLeft = scrollLeft;
    }

    /*function onResize(node: HTMLElement) {
        const obs = new ResizeObserver(entries => {
            containerWidth = entries[0].contentRect.width;
        });
        obs.observe(node);
        return {destroy: () => obs.disconnect()};
    }*/

    /*function updateCharWidth(sample: HTMLElement): void {
        const rect = sample.getBoundingClientRect();
        headerCharWidth = rect.width;
    }*/

    const updateCharWidth: Action = (node: HTMLElement) => {
        headerCharWidth = node.getBoundingClientRect().width;
    }

    function getTextWidth(text: string): number {
        return headerCharWidth * text.length;
    }

    //? Does it work
    const onResize: Action = (node) => {
        $effect(() => {
            const obs = new ResizeObserver(entries => containerWidth = entries[0].contentRect.width);
            obs.observe(node);
        });
    };


    $effect(() => {
        console.log(visibleTasks);
        console.log(sidebarWidth, tickWidth);
        console.log(resolver.locationExists, resolver.mappingExists)
    })

</script>

<div class="timeline-layout" onwheel={handleGlobalWheel}>
    <div class="controls">
        <label>
            Zoom:
            <input type="range" min="5" max="200" bind:value={zoom}/>
        </label>
        <div class="stats">
            Visible: {visibleTasks.length} / {dataSource.longestTasks.length}
            ScrollLeft: {scrollLeft}
        </div>
    </div>

    <div class="header-container" bind:this={headerEl}>
        <div class="sidebar-placeholder" bind:this={staticHeader} bind:clientWidth={sidebarWidth}>Application</div>

        <div class="header-track" style="width: {totalWidth}px">
            <div class="template-tick-time" use:updateCharWidth>M</div>
            {#each visibleTicks as tick, i}

                {@const tickX = getPos(tick)}
                {@const formattedTime = formatter.format(tick)}
                {@const nextTick = visibleTicks[i + 1]}
                {@const tickSpace = getPos(nextTick) - tickX || 0}
                {@const offLeft = scrollLeft - tickX}
                {@const buffer = 10}
                {@const overlap = Math.max(0, offLeft)}
                {@const boundary = tickSpace - overlap}
                {@const textWidth = getTextWidth(formattedTime)}
                <div class="tick"
                     style:left={`${tickX}px`}
                     style:transform={`translateX(${offLeft > 0 && boundary > textWidth - buffer ? offLeft : 0}px)`}
                >
                    {formatter.format(tick)}
                </div>
            {/each}
        </div>
    </div>

    <div class="body-scroll" bind:this={bodyEl} onscroll={handleNativeScroll} use:onResize>
        <div class="rows-wrapper" style="width: {totalWidth}px" bind:clientHeight={rowsWrapperHeight}>
            {#each dataSource.rows as row}
                <div class="row">
                    <div class="sidebar-cell" title={row.displayName}>{row.displayName}</div>

                    {#if true}
                        <div class="task-track">
                            {#each visibleTasks as task (task.uid)}
                                {#if task.resourceId === row.id}
                                    <div
                                            class="task-bar"
                                            style="left: {getPos(task.from)}px;"
                                            style:width={`${Math.max(2, getPos(task.to) - getPos(task.from))}px`}
                                            title={task.label}
                                    >
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</div>

<style lang="scss">
  .template-tick-time {
    opacity: 0;
    position: absolute;
    left: 0;
    top: 0;
  }


  /* LAYOUT FRAMEWORK */
  .timeline-layout {
    display: flex;
    flex-direction: column;
    //height: 100vh;
    width: 100%;
    height: 50%;
    overflow: hidden; //? might cause issues with scrolls
    font-family: monospace;
    background-color: white;
  }

  .controls {
    padding: 8px 12px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #ddd;
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
  }

  /* HEADER */
  .header-container {
    display: flex;
    overflow-x: hidden; // Hides scrollbar, moved by JS
    background-color: #f1f3f5;
    border-bottom: 1px solid #ccc;
    height: 30px;
    flex-shrink: 0;
  }

  .header-track {
    position: relative;
    height: 100%;
    /* flex-shrink: 0 ensures the div doesn't collapse if totalWidth is huge */
    flex-shrink: 0;
  }

  /* BODY SCROLL AREA */
  .body-scroll {
    flex: 1; // Fills remaining height
    overflow: auto;
    position: relative;
  }

  // Wrapper inside body that forces the width
  .rows-wrapper {
    display: flex;
    flex-direction: column;
    // Critical: forces the scrollbar to appear
    min-width: max-content;
  }

  /* ROW & SIDEBAR */
  .row {
    display: flex;
    height: 32px;
    border-bottom: 1px solid #eee;
    width: 100%;
  }

  .sidebar-placeholder, .sidebar-cell {
    width: 180px;
    min-width: 180px;
    max-width: 180px;

    position: sticky;
    left: 0;
    z-index: 20;

    background-color: white;
    border-right: 1px solid #ddd;
    padding: 0 8px;

    // Centering text
    display: flex;
    align-items: center;

    // Text overflow handling
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-placeholder {
    background-color: #e9ecef;
    font-weight: bold;
    z-index: 30;
  }

  /* TASKS & TICKS */
  .task-track {
    flex: 1;
    position: relative;
    height: 100%;
  }

  .tick {
    position: absolute;
    bottom: 0;
    //height: 60%;
    border-left: 1px solid #999;
    padding-left: 4px;
    font-size: 10px;
    color: #555;
    pointer-events: none;
    white-space: nowrap;
    overflow-y: hidden;

    transition: opacity 0.2s, transform 0.1s;
    will-change: transform;
  }

  .task-bar {
    position: absolute;
    top: 6px;
    bottom: 6px;
    background-color: #339af0;
    border-radius: 4px;
    opacity: 0.9;
    pointer-events: auto;

    &:hover {
      opacity: 1;
      background-color: #1c7ed6;
      z-index: 10;
    }
  }
</style>