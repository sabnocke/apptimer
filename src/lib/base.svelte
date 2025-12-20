<script lang="ts">
  import Listing from "./listing.svelte";
  import LargerListing from "$lib/largerListing.svelte";
  import Timeline from "$lib/Timeline.svelte";

  interface Props {
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
  let topRow = $state<HTMLDivElement>(DEFAULT);

  function resetTopRow() {
    document.documentElement.style.setProperty("--top-row-height", "1fr");
  }

  function resetLeftCol() {
    document.documentElement.style.setProperty("--left-col-width", "1fr");
  }

  function resizeLeftCol(event: MouseEvent) {
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
  }


  document.addEventListener("mousemove", resizeTopRow);
  document.addEventListener("mousemove", resizeLeftCol);
  document.addEventListener("mouseup", () => {
    isResizingHorizontal = false;
    isResizingVertical = false;
  })

</script>

<!--<div class="grids" bind:this={centralContainer}>-->
<!--  <div class="topRow" bind:this={topRow}>-->
<!--    div1-->
<!--  </div>-->
<!--  <div class="td-resizer">-->
<!--    <button title="clickable-td-resizer" class="btn-td-resizer"-->
<!--            onmousedown={() => isResizingHorizontal = true}-->
<!--            ondblclick={resetTopRow}-->
<!--    ></button>-->
<!--  </div>-->
<!--  <div class="bottomRow">-->
<!--    <div class="left" bind:this={leftCol}>-->
<!--      <LargerListing />-->
<!--    </div> &lt;!&ndash; left &ndash;&gt;-->
<!--    <div class="lr-resizer">-->
<!--      <button title="clickable-lr-resizer" class="btn-lr-resizer"-->
<!--              onmousedown={() => isResizingVertical = true}-->
<!--              ondblclick={resetLeftCol}-->
<!--      ></button>-->
<!--    </div> &lt;!&ndash; resizer &ndash;&gt;-->
<!--    <div class="right">-->
<!--      <Listing />-->
<!--    </div> &lt;!&ndash; right &ndash;&gt;-->
<!--  </div>-->
<!--</div>-->

<div class="controls">
  Control
</div>
<div class="display">
  <Timeline />
</div>


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