<script lang="ts">
    import {goto} from "$app/navigation";

    let {
        names = new Map(),
        active = "",
    }: {
        names?: Map<string, string>;
        active: string;
    } = $props();

    let activeInNames = $derived(!!names.keys().find(x => x === active)); //TODO

</script>

<div class="radio-buttons">
    {#each names.entries() as [name, path], i (i)}
        <label class="radio">
            <input type="radio" name="radio" checked={name === active} onclick={() => goto(path)}>
            <span class="name">{name}</span>
        </label>
    {/each}
</div>

<style lang="scss">
    .radio-buttons {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      border-radius: 0.5rem;
      background-color: #EEE;
      box-sizing: border-box;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.86);
      padding: 0.25rem;
      width: 300px;
      font-size: 14px;

      .radio {
        flex: 1 1 auto;
        text-align: center;

        input {
          display: none;

          &:checked + .name {
            background-color: #fff;
            font-weight: 600;
          }
        }

        .name {
          display: flex;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          border: none;
          padding: .5rem 0;
          color: rgba(51, 65, 85, 1);
          transition: all .15s ease-in-out;
        }
      }


    }
</style>