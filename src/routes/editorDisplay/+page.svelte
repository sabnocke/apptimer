<script lang="ts">
    import {goto} from "$app/navigation";
    import {
        addRecognitionRule,
        type DailyAppStat,
        findPatternMatches,
        findWindowTitles,
        getDailyBreakdown,
        resolver
    } from "$lib/services";
    import Loader from "$lib/components/Loader.svelte";
    import GenericRadioButtons from "$lib/components/GenericRadioButtons.svelte";

    let uneditedData = $state<DailyAppStat[] | null>(null);

    $effect(() => {
        getDailyBreakdown(new Date(), new Date()).then(result => uneditedData = result);
    });

    let checked = $state<{ id: number, value: string }>({id: -1, value: ""});
    let resolvedWindowTitles = $state<Set<string>>(new Set);
    let showAll: boolean = $state(false);
    let searchQuery: string = $state("");
    let filteredItems: string[] = $state([]);
    let one = $state(false);
    let a = $state(false);
    let aValue: string | null = $state(null);
    let b = $state(false);
    let bValue: string | null = $state(null);
    let newName = $state("");
    let loading = $state(false);
    let selectedValue: string = $state("");

    const sleep = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

    function handleChange(id: number, value: string): void {
        if (checked.id === id && checked.value === value) {
            //deselect
            checked = {id: -1, value: ""}
        } else {
            //select
            checked = {id, value}
        }
    }

    function handleTest(): boolean {
        if (bValue !== null) {
            console.log("Started finding matches...")
            findPatternMatches(searchQuery, bValue).action(
                v => v.then(result => filteredItems = result),
                e => console.warn(e)
            );

            console.log(filteredItems);

            return true;
        }
        return false;
    }

    async function setChange(process_key: string, pattern: string | null, display_name: string) {
        if (pattern) {
            loading = true;
            const result = await addRecognitionRule(process_key, pattern, display_name);
            await sleep(3000);
            loading = false;
            return result;
        }

        return false;
    }

    $effect(() => {
        if (checked.id !== -1) {
            findWindowTitles(checked.value).action(
                v => v.then(result => resolvedWindowTitles = new Set(result)),
                e => console.warn(e)
            );
        }
    });

    //TODO rework this
</script>

<div class="full">
    <button onclick={() => goto("/")}>Back</button>

    <div class="placement">
        <button onclick={() => one = !one}>Add resolver rule</button>

        {#if one}
            <div class="place-on-line">
                <div>Starts with:</div>
                <select name="title" id="titles" bind:value={searchQuery}>
                    {#each uneditedData as entry}
                        <option value={entry.process_key}>{entry.process_key}</option>
                    {/each}
                </select>
            </div>
            <div>{searchQuery}</div>
            <GenericRadioButtons names={["Process", "", "Window title"]} checked="" bind:selected={selectedValue} />
        {/if}

        {#if one && a}
            <label>
                New name:
                <input type="text" bind:value={aValue}>
            </label>
        {/if}

        {#if one && b && searchQuery}
            <label>
                Pattern:
                <input type="text" bind:value={bValue}>
            </label>
            <label>
                New name:
                <input type="text" bind:value={newName}>
            </label>
            <button onclick={handleTest}>Test</button>
            <button title="submit"
                    onclick={() => setChange(searchQuery, bValue, newName).then(r => console.log("setChange result: ", r))}
                    disabled
            >Set</button>
            {#each filteredItems as item}
                <div>{item}</div>
            {/each}
        {/if}

        {#if loading}
            <Loader />
        {/if}

        <!--<div hidden={!one}>Starts with:</div>
        <select name="title" id="titles" hidden={!one} bind:value={searchQuery}>
            {#each uneditedData as entry}
                <option value={entry.process_key}>{entry.process_key}</option>
            {/each}
        </select>
        <div hidden={!one}>{searchQuery}</div>
        <div hidden={!one}>Resolves to:</div>
        <input hidden={!one} type="text" bind:value={newName}>
        <button hidden={!one}>Ok</button>

        <div hidden={!one}>{searchQuery} -> {newName}</div>-->
    </div>
</div>

<style lang="scss">
  :global(body) {
    padding: 0;
    margin: 0;
  }

  .single-item {
    display: flex;
    flex-direction: row;
    width: 100%;

    &:nth-child(n) {
      flex-grow: 1;
    }
  }

  .placement {
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    height: 100%;
    flex: 1 0 auto;
  }

  .place-on-line {
    display: flex;
    column-gap: 1rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    align-items: center;
  }
</style>