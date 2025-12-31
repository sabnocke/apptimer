<script lang="ts">
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

  const formatter = Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "short",
    timeStyle: "short",
  });

</script>

<div class="container">
  <div class="name">{name}</div>
  <div class="range-container">
    <span class="range__text">{percentage}</span>
    <div class="range" style:--p={percentage}></div>
  </div>
  <div class="sub-container">
    <div>{formatter.format(start)}</div>
    <div>{formatter.format(end)}</div>
    <span class="time">{time}</span>
  </div>
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
    grid-template-columns: 0.75fr 0.75fr 1fr;
    column-gap: 1rem;
    row-gap: 0;
    max-height: 35px;



    &:first-child {
      padding-top: 0.5rem;
    }

    &:not(:first-child) {
      padding-top: 0.3rem;
    }

    &:not(:last-child) {
      border-bottom: 1px solid rgba(0,0,0,0.1);
      padding-bottom: 0.3rem;
    }

    &:last-child {
      padding-bottom: 0.5rem;
    }
  }

  .sub-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);

    &:nth-child(n) {
      text-align: center;
    }

    &:last-child {
      margin-right: 0.5rem;
    }

  }

  .name {
    padding-left: 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    border-right: 1px solid rgba(0, 0, 0, 0.1);
    background-clip: padding-box;
  }

  .range-container {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
  }

  .range {
    position: relative;
    background-color: rgba(0,0,0,0.05);
    width: 75%;
    min-width: 80px;
    max-width: 300px;
    height: 15px;

    clip-path: polygon(0 0, 100% 0, 95% 100%, 0 100%);

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
      z-index: 1;
      font-family: "Orbitron", monospace;
    }
  }

  
  @keyframes load {
    to {
      width: var(--width);
    }
  }
</style>