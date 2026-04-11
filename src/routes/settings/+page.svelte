<script lang="ts">
    import {goto} from "$app/navigation";
    import {settings} from "$lib/services";

    let show_unknown = $state(settings.show_unknown);
    let show_group = $state(settings.show_group);
    let show_group_option = $state(settings.show_group_option)

    $effect(() => {
        settings.show_unknown = show_unknown;
        settings.show_group = show_group;
        settings.show_group_option = show_group_option;

        settings.invalidate();
    });

</script>

<button onclick={() => goto("/")}>Back</button>

<fieldset>
    <legend>About aggregation (UNKNOWN, System, ...):</legend>

    <label>
        <input type="checkbox" bind:checked={show_unknown}>
        Show UNKNOWN
    </label>
    <div class="container">
        <label class="main-text">
            <input type="checkbox" bind:checked={show_group}>
            Show Idle/System as
        </label>
        <div class="subcontainer">
            <div>
                <input type="radio" id="one" name="one/two" value="one"
                       checked={show_group_option === "one"} bind:group={show_group_option}>
                <label for="one">one group</label>
            </div>
            <div>
                <input type="radio" id="two" name="one/two" value="two" bind:group={show_group_option}>
                <label for="two">separate entries</label>
            </div>
        </div>
    </div>
</fieldset>

<style lang="scss">
    .container {
      display: flex;
      padding-right: 0.125rem;

      .subcontainer {
        display: flex;
        flex-direction: column;
      }
    }

    .main-text {
      padding-right: 0.125rem;
    }
</style>