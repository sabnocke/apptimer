<script lang="ts">
    import {getDailyBreakdown} from "$lib/services/ipc";
    import {stringToColor, type ChartDay, type DailyAppStat, settings, split, group} from "$lib/services";
    import {resolver} from "$lib/services";

    let {start, end} = $props<{start: Date, end: Date}>();

    let chartData: ChartDay[] = $state([]);
    let displayData: Row[] = $state([]);
    let maxDailyTotal = $state(1);

    let hoveredDay: Row | null = $state(null);
    let mousePos = $state({ x: 0, y: 0});

    interface DisplayData extends DailyAppStat {
        uid: string;
        percent: number;
    }
    interface Row {
        total: number;
        day: string;
        source: DisplayData[];
    }

    function onEnter(e: MouseEvent, d: Row) {
        hoveredDay = d;
        updateMouse(e);
    }
    function onMove(e: MouseEvent) {
        updateMouse(e);
    }
    function onLeave(e: MouseEvent) {
        hoveredDay = null;
    }
    function updateMouse(e: MouseEvent) {
        mousePos = {
            x: e.clientX + 15,
            y: e.clientY + 15
        };
    }



    function preprocess(src: DailyAppStat[]): DailyAppStat[] {
        let fin = settings.aggregate_group() ? group(src) : src;
        fin = fin.map<DailyAppStat>(item => {
            return {
                ...item,
                final_name: resolver.resolveComplex(item.process_key)
            }
        });

        if (!settings.show_unknown)
            fin = fin.filter(item => item.final_name !== "UNKNOWN" || item.process_key !== "UNKNOWN");
        if (!settings.show_group)
            fin = fin.filter(
                item => {
                    const b = item.final_name !== "Idle/System";
                    const c = !resolver.isSystemNoise(item.process_key);
                    return b || c;
                }
            );

        return fin;
    }

    async function loadData() {
        const s = start.toLocaleDateString("en-CA");
        const e = end.toLocaleDateString("en-CA");

        const raw = await getDailyBreakdown(s, e);
        const processed = preprocess(raw);
        const daysMap = Map.groupBy(processed, item => item.day);

        const sortedDaysMap = new Map<string, Row>();
        for (const [key, value] of daysMap.entries()) {
            const remapped = value.map<DisplayData>(one => ({
                ...one,
                uid: one.process_key + String(one.total_seconds),
                percent: 0.0
            }))

            const newRow: Row = {
                total: remapped.map(one => one.total_seconds).reduce((acc, one) => acc + one, 0),
                day: key,
                source: remapped.toSorted((a, b) => a.total_seconds - b.total_seconds)
            }
            sortedDaysMap.set(key, newRow);
        }
        const matrix = Array.from(sortedDaysMap.values());
        for (const row of matrix) {
            const t = row.total;
            row.source.forEach(item => {
                item.percent = (item.total_seconds / t)
            });
        }
        displayData = matrix;
    }

    $effect(() => {
        loadData();
    });

    let minHeight = $state(200);

    const formatter = Intl.DateTimeFormat("cs-CZ", {
        weekday: "long",
    });

    function fitScreen(node: HTMLElement, {x, y}: {x: number, y: number}) {
        function update(pos: {x: number, y: number}) {
            const rect = node.getBoundingClientRect();
            const padding = 10; // space from edge of screen

            let safeX = pos.x;
            let safeY = pos.y;

            if (safeX + rect.width > window.innerWidth - padding) {
                safeX = pos.x - rect.width - 20;
            }

            if (safeY + rect.height > window.innerHeight - padding) {
                safeY = pos.y - rect.height - 20;
            }

            node.style.left = `${safeX}px`;
            node.style.top = `${safeY}px`;
        }
        update({x, y});

        return {
            update
        }
    }

</script>


<div class="chart-container">
    {#each displayData as row}
        <div class="one-bar"
             style:min-height={`${minHeight}px`}
             onmouseenter={(e) => onEnter(e, row)}
             onmousemove={onMove}
             onmouseleave={onLeave}
             role="group"
        >
            <div>{row.day}</div>
            {#each row.source as cell (cell.uid)}
                {@const calibratedHeight = `${Math.max(minHeight * cell.percent, 2)}px`}
                <div
                        style:height={calibratedHeight}
                        style:background-color={stringToColor(cell.final_name)}
                ></div>
            {/each}
        </div>

    {/each}

    {#if hoveredDay}
        <div class="tooltip-card"
             use:fitScreen={{ x: mousePos.x, y: mousePos.y }}
        >
            <strong>{formatter.format(new Date(hoveredDay.source[0].day))}</strong>
            <div class="divider"></div>
            {#each hoveredDay.source as segment (segment.uid)}
                <div class="row">
                    <span style:color={stringToColor(segment.final_name)}>●</span>
                    <span>{resolver.resolve(segment.final_name)}</span>
                    <span class="right">{segment.percent < 0.01 ? "< 1%" : (segment.percent * 100).toFixed(2) + "%"}</span>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">
    .chart-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 20px;
      gap: 10px;
      background-color: white;
      border-top: 1px solid black;
    }

    .one-bar {
      display: flex;
      flex-direction: column;
    }

    .tooltip-card {
      position: fixed;
      z-index: 1000;
      background-color: whitesmoke;
      border: 1px solid #454545;
      padding: 10px;
      border-radius: 6px;
      pointer-events: none;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
      min-width: 150px;
    }

    .row {
      display: flex;
      gap: 8px;
      font-size: 0.85rem;
    }

    .right {
      margin-left: auto;
      color: #aaa;
    }

    .divider {
      height: 1px;
      background: #444;
      margin: 5px 0;
    }
</style>