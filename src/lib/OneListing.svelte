<script lang="ts">

  interface Props {
    name: string,
    percentage: string,
    time: string
  }

  let {
    name,
    percentage,
    time
  }: Props = $props();

  function calculateWidth() {
    const fP = parseFloat(percentage) / 100;
    const baseBoxWidth = 6; // rem
    return fP * baseBoxWidth;
  }

  let newWidth = $derived.by(() => {
    const fP = parseFloat(percentage) / 100;
    const baseBoxWidth = 6; // rem
    return fP * baseBoxWidth;
  })

  let offset = $derived.by(() => {
    const fP = parseFloat(percentage) / 100;
    const baseBoxWidth = 6; // rem
    const newOffset = Math.min(fP * baseBoxWidth, baseBoxWidth * (1 - 0.75));

    return newOffset.toString() + "rem";
  })




</script>

<div class="container">
  <span class="name">{name}</span>
  <div class="outer-box">
    <div class="inner-box" style:width={newWidth.toString() + "rem"}></div>
    <div class="inner-box-2" style:margin-left={offset}>
      <span class="percentage">{percentage}</span>
    </div>
  </div>
  <span class="time">{time}</span>
</div>

<style lang="scss">
  @use "sass:color";

  :root {
    --base-box-width: 6rem;
    --inner-box-width: 6rem;
  }

  .container {
    display: grid;

    grid-template-rows: 1fr;
    grid-template-columns: 1fr repeat(2, 12vw);
    gap: 0;
    width: 100%;
    height: 100%;

    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .outer-box {
    display: flex;
    align-items: center;

    height: 1.5rem;
    width: var(--base-box-width);
    background-color: black;
  }

  .inner-box {
    height: 80%;
    //width: var(--inner-box-width);
    background-color: red;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .inner-box-2 {
    position: absolute;

  }

  .percentage {
    background-color: color.change(#2f2f2f, $alpha: 80%);
    font-size: 0.8rem;
    color: white;
    white-space: nowrap;
    user-select: none;
  }
</style>