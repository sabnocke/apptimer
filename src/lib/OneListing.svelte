<script lang="ts">
  //TODO maybe figure out how to make the percentage text (.range__text) more readable on the darker background

  let {
    name,
    percentage,
    time,
    start,
    end
  } : {
    name: string,
    percentage: string
    time: string
    start: Date
    end: Date
  } = $props();

  /*$effect(() => {
    console.log(name, percentage, time);
  })*/

  const formatter = Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const formatedStart = $derived(formatter.format(start));
  const formatedEnd = $derived(formatter.format(end));

</script>

<div class="container">
  <span class="name">{name}</span>
  <div class="range" style:--p={percentage}>
    <span class="range__text">{percentage}</span>
  </div>
  <div>
    <span>{formatedStart}</span>
    <span>{formatedEnd}</span>
  </div>
  <span class="time">{time}</span>
</div>

<style lang="scss">
  @use "sass:color";
  @import url('https://fonts.googleapis.com/css2?family=Orbitron&display=swap');

  :root {
    --base-box-width: 6rem;
    --inner-box-width: 6rem;
  }

  .container {
    display: grid;
    align-items: center;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 0;
    max-height: 35px;

    &:first-child {
      padding-top: 0.5rem;
    }

    &:not(:first-child) {
      padding-top: 0.3rem;
    }

    &:not(:last-child) {
      border-bottom: #ffffeb1a 1px solid;
      padding-bottom: 0.3rem;
    }

    &:last-child {
      padding-bottom: 0.5rem;
    }
  }

  .name {
    padding-left: 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .time {
    text-align: right;
    margin-right: 0.5rem;
  }

  .range {
    position: relative;
    background-color: #333;
    width: inherit;
    min-width: 80px;
    height: 30px;
    transform: skew(30deg);

    font-family: "Orbitron", monospace;

    &:before {
      --width: var(--p);
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background-color: #F3E600;
      z-index: 0;
      animation: load .5s forwards linear;
    }

    &__text {
      content: var(--p) '%';
      color: #000;
      position: absolute;
      left: 5%;
      top: 50%;
      transform: translateY(-50%) skewX(-30deg);
      z-index: 1;
    }
  }

  
  @keyframes load {
    to {
      width: var(--width);
    }
  }
</style>