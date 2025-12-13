<script lang="ts">
    import {EMPTY_LOG, type LogEntry, fetchData, string2date} from "$lib/services/dataProvider.svelte";
    import {listen} from "@tauri-apps/api/event";
    import {Timing} from "$lib/types/timing";
    import OneDateEntry from "$lib/OneDateEntry.svelte";

    let source = $state(EMPTY_LOG);

    $effect(() => {
        fetchData().then(result => {
            source = result;
        });
    })

    listen<LogEntry<string>[]>("activity_change", change => {
        change.payload.forEach(entry => {
            source.push(string2date(entry))
        });
    });

    interface SingleEntry {
        title: string,
        time: Timing
    }

    const display = $derived.by(() => {
        const result: SingleEntry[] = []
        source.forEach(x => {
            const time = new Timing(x.start_time, x.end_time ?? x.temp_end_time);
            const title = x.window_title ? x.window_title : x.process_name;

            result.push({title, time});
        });

        return result;
    });

    const displayable = $derived(display.sort((a, b) => a.time.cmp(b.time, "start")).slice(0, 10));
</script>

<style lang="scss">
    .list {
      display: flex;
      flex-direction: column;
      //grid-template-columns: 2fr 1fr 5px 1fr;
    }

    .header {
      display: grid;
      grid-template-columns: 2fr 1fr auto 1fr;
      background-color: greenyellow;

      &__sep {
        width: 2px;
        height: 100%;
        background-color: black;
      }

      &__date {
        text-align: center;
      }
    }


</style>

<div class="list">
    <div class="header">
        <span class="header__title">Name</span>
        <span class="header__date">Start</span>
        <div class="header__sep"></div>
        <span class="header__date">End</span>
    </div>
    {#each displayable as one, i (i)}
        <OneDateEntry name={one.title} time={one.time} />
    {/each}
</div>

