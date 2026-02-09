<script lang="ts">
    import type {Snippet} from "svelte";

    let {
        headerName,
        children
    } : {
        headerName: string
        children?: Snippet
    } = $props();

    let showDropdown = $state(false);
    let dropdownContent = $state({} as HTMLDivElement);
    let contentClicked = $state(false);

    function switchDropdown() {
        dropdownContent.classList.toggle(".show");
    }

    window.onclick = function (event) {
        const target = event.target as Element;
        if (target.matches(".dropdown-button")) {
            return;
        }

    }
</script>

<div class="dropdown-base">
    <button class="dropdown-button" onclick={switchDropdown}>{headerName}</button>
    <div class="dropdown-content" bind:this={dropdownContent}>
        {@render children?.()}
    </div>
</div>

<style lang="scss">
    .dropdown-button {
      background-color: #3498DB;
      color: white;
      padding-left: 1rem;
      font-size: 16px;
      border: none;
      cursor: pointer;

      &:hover, &:focus {
        background-color: #2980B9;
      }
    }

    .dropdown-base {
      position: relative;
      display: inline-block;
    }

    .dropdown-content {
      display: none;
      position: absolute;
      background-color: #f1f1f1;
      min-width: 160px;
      box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2);
      z-index: 1;
    }

    .dropdown-content button {
      color: black;
      padding: 12px 16px;
      text-decoration: none;
      display: block;

      &:hover {
        background-color: #ddd;
      }
    }

    .show {
      display: block;
    }

</style>