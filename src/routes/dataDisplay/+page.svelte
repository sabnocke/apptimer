<script lang="ts">
    //TODO buttons could generate long string and then display it

    import UnboundRenderer from "$lib/UnboundRenderer.svelte";
    import type {KnownSelect} from "$lib/types";
    import {goto} from "$app/navigation";
    import {dataSource} from "$lib/services";
    import {parsedDataCreator} from "$lib/services";

    let option: KnownSelect | null = $state(null);

    $effect(() => {
        console.log(option);
    });

    function triggerLoad() {
        dataSource.fetchData().then(r => {
            console.clear();
            r.action(console.log, console.error)
        });
    }
</script>

<div class="container">
    <div class="sidebar-base">
        <button class="some-btn" onclick={() => option = "names"}>Unique names</button>
        <button class="some-btn" onclick={() => option = "data"}>Entry data</button>
        <button class="some-btn" onclick={triggerLoad}>Trigger load</button>
        <button class="some-btn" onclick={() => console.log(dataSource.longestTasks)}>Show longestTasks</button>
        <button class="some-btn" onclick={() => console.log(dataSource.error)}>Show error</button>
        <button class="some-btn" onclick={() => console.log(parsedDataCreator())}>Show parsed data</button>
        <div></div>
        <button class="some-btn" onclick={() => option = null}>Clear</button>
        <button class="some-btn" onclick={() => goto("/")}>Back</button>
    </div>
    <div class="display-area">
        {#if option === "names"}
            <UnboundRenderer select="names" />
        {:else if option === "data"}
            <UnboundRenderer select="data" />
        {/if}
    </div>
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
    //height: 100%;
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