<script lang="ts">
    import {Timing} from "$lib/types/timing";

    let {
        name,
        time
    } : {
        name: string,
        time: Timing,
    } = $props();
</script>

<style lang="scss">
  .entry {
    display: grid;
    grid-template-columns: 2fr 1fr auto 1fr;

    &:not(:last-child) {
      border-bottom: black 1px solid;
    }
  }

  .separator {
    height: 100%;
    width: 2px;
    background-color: black;
  }

  .time-string {
    text-align: center;
  }

  .title {
    padding-left: 1rem;
  }
</style>

<div class="entry">
    <span class="title">{name}</span>
    <span class="time-string">{time.start.toLocaleString("cs-CZ")}</span>
    <div class="separator"></div>
    <span class="time-string">{time.end.toLocaleString("cs-CZ")}</span>
</div>