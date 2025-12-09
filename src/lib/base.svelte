<script lang="ts">
  import Listing from "./listing.svelte";

  interface Props {
    minTopRowHeight: number,
    minLeftColWidth: number
  }

  let {
    minTopRowHeight = 100,
    minLeftColWidth = 100
  }: Props = $props();

  let isResizingVertical = $state(false);
  let isResizingHorizontal = $state(false);


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

<div id="griding" bind:this={centralContainer}>
  <div id="topRow" bind:this={topRow}>
    div1
  </div>
  <div id="td-resizer">
    <button title="clickable-td-resizer" id="btn-td-resizer"
            onmousedown={() => isResizingHorizontal = true}
            ondblclick={resetTopRow}
    ></button>
  </div>
  <div id="bottomRow">
    <div id="left" bind:this={leftCol}>
      div2
    </div>
    <div id="lr-resizer">
      <button title="clickable-lr-resizer" id="btn-lr-resizer"
              onmousedown={() => isResizingVertical = true}
              ondblclick={resetLeftCol}
      ></button>
    </div>
    <div id="right">
      <Listing />
    </div>
  </div>
</div>


<style lang="scss">
  @use "sass:color";

  :root {
    --left-col-width: 1fr;
    --top-row-height: 1fr;
  }

  #griding {
    display: grid;
    grid-template-rows: var(--top-row-height) 1rem 1fr;
    width: 100%;
    height: 100%;
  }

  $btn-offset: 0.5rem;

  #td-resizer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    align-content: center;
    padding-left: $btn-offset;
    padding-right: $btn-offset;
  }

  #lr-resizer {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-content: center;
    align-items: center;
    padding-top: $btn-offset;
    padding-bottom: $btn-offset;
  }

  $btn-bg-color: #818589;

  #btn-td-resizer {
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

  #btn-lr-resizer {
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

  #topRow {
    background-color: rgba(26, 186, 63, 0.5);
  }

  #left {
    background-color: rgba(62, 188, 197, 0.5);
  }

  #right {
    background-color: rgba(32, 10, 154, 0.5);
  }

  #bottomRow {
    display: grid;
    grid-template-columns: var(--left-col-width) 1rem 1fr;
  }

</style>