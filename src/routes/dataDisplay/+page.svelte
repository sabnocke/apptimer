<script lang="ts">
    import {goto} from "$app/navigation";
    import {dataSource} from "$lib/services";
    import {
        parsedDataCreator2,
        parsedDataCreatorSyn,
        getStatsInRange
    } from "$lib/services";

    function triggerLoad() {
        dataSource.fetchData().then(r => {
            console.clear();
            r.action(console.log, console.error)
        });
    }

    function fullClear(): void {
        console.clear();
    }

</script>

<div class="container">
    <div class="sidebar-base">
        <button class="some-btn" onclick={() => console.log(dataSource.uniqueNames())}>Unique names</button>
        <button class="some-btn" onclick={() => console.log($state.snapshot(dataSource.getUniqueNames))}>Get unique names</button>
        <button class="some-btn" onclick={() => console.log($state.snapshot(dataSource.data))}>Entry data</button>
        <button class="some-btn" onclick={triggerLoad}>Trigger load</button>
        <button class="some-btn" onclick={() => console.log(dataSource)}>Show error</button>
        <button class="some-btn" onclick={() => console.log(parsedDataCreator2())}>Show parsed data 2</button>
        <button class="some-btn" onclick={() => console.log(parsedDataCreatorSyn())}>parsedDataCreatorSyn</button>
        <button class="some-btn" onclick={() => console.log(getStatsInRange("2026-01-23", "2026-01-30"))}>
            Test getStatsInRange for 23-01-2026 -- 30-01-2026
        </button>
        <button class="some-btn" onclick={() => console.log($state.snapshot(dataSource.data2))}>
            dataSource.data2
        </button>
        <div></div>
        <button class="some-btn" onclick={fullClear}>Clear</button>
        <button class="some-btn" onclick={() => goto("/")}>Back</button>
    </div>
    <div class="display-area"></div>
</div>


<style lang="scss">
  :global(body) {
    margin: 0;
  }

  .container {
    height: 100dvh;
    background-color: #555555;
    display: flex;
  }

  .some-btn {
    cursor: pointer;
  }

  .display-area {
    margin: 0.5rem;
    background-color: cadetblue;
    flex: 1 0 auto;
    border-radius: 12px;
  }

  .sidebar-base {
    background-color: black;
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0.3rem;
    gap: 0.5rem;
    flex: 0 1 15%;
    overflow: hidden;

    div {
      flex: 1 0 auto;
    }

    .some-btn {
      flex: 0 1 auto;
    }
  }
</style>