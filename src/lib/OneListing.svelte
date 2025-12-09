<script lang="ts">
  interface Props {
    name: string,
    percentage: number,
    time: string
  }

  let {
    name,
    percentage = -1,
    time
  }: Props = $props();


</script>

<div class="container">
  <span class="name">{name}</span>
  <div class="outer-box">
    <div class="inner-box">
      <span class="percentage"></span>
    </div>
  </div>
  <span class="time">{time}</span>
</div>

<style lang="scss">
  :root {
    --base-box-width: 4rem;
    --inner-box-width: 4rem;
  }

  .container {
    display: grid;

    grid-template-rows: 1fr;
    grid-template-columns: 1fr repeat(2, 10vw);
    gap: 0;
    width: 100%;
    height: 100%;

    //justify-content: space-between;
    //align-items: center;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .outer-box {
    display: flex;
    align-items: center;

    height: 1rem;
    width: var(--base-box-width);
    background-color: black;
  }

  .inner-box {
    height: 80%;
    width: var(--inner-box-width);
    background-color: red;
  }
</style>