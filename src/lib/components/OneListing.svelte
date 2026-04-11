<script lang="ts">
  let {
    name,
    percentage,
    time,
  } : {
    name: string,
    percentage: string
    time: string
  } = $props();
</script>

<div class="container">
  <div class="name">{name}</div>
  <span class="percentage text">{percentage}</span>
  <span class="text">{time}</span>
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
    grid-template-columns: 60% 20% 20%;
    max-height: 35px;

    &:first-child {
      padding-top: 0.5rem;
    }

    &:last-child {
      padding-bottom: 0.5rem;
    }

    &:not(:first-child) {
      padding-top: 0.3rem;
    }

    &:not(:last-child) {
      border-bottom: 1px solid rgba(0,0,0,0.1);
      padding-bottom: 0.3rem;
    }
  }

  .text {
    text-align: center;
    width: 100%;
  }

  .name {
    padding-left: 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    border-right: 1px solid rgba(0, 0, 0, 0.1);
    background-clip: padding-box;
  }

  .percentage {
    border-right: 1px solid rgba(0, 0, 0, 0.1);

    content: var(--p) '%';
    color: #000;
    z-index: 1;
    font-family: "Orbitron", monospace;
  }
</style>