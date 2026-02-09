<script lang="ts">
    import {uiState} from "$lib/services";

    function handleAction(action: () => void) {
        action();
        uiState.closeMenu();
    }
</script>

{#if uiState.menu}
    <!--TODO add fitScreen into the div below-->
    <div
            class="context-menu"
            style:top="{uiState.menu.y}px"
            style:left="{uiState.menu.x}px"
            onclick={(e) => e.stopPropagation()}
            onkeyup={(e) => e.stopPropagation()}
            role="button"
            tabindex="0"
    >
        <div class="header">{uiState.menu.item.final_name}</div>
        <button class="clickable" type="button" onclick={() => handleAction(() => {
            uiState.openModal("rule-editor", uiState.menu?.item);
        })}>
            ✏️ Add Recognition Rule
        </button>
        <!-- Not really needed -->
        <button class="clickable" type="button" onclick={() => handleAction(() => {
            console.log("Hiding...", uiState.menu?.item);
        })}>
            👁️ Hide App
        </button>

        <div class="divider"></div>

        <button type="button"
                tabindex="0"
                title="backdrop"
                class="backdrop"
                onclick={() => uiState.closeMenu()}
        ></button>
    </div>
{/if}

<style lang="scss">
  .context-menu {
    position: fixed;
    z-index: 9999;
    background-color: #252526;
    border: 1px solid #454545;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    min-width: 180px;
    padding: 4px;
    display: flex;
    flex-direction: column;
  }

  .header {
    padding: 8px 12px;
    font-size: 0.8rem;
    color: #888;
    border-bottom: 1px solid #333;
    margin-bottom: 4px;
  }

  .clickable {
    background: none;
    border: none;
    color: #eee;
    text-align: left;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.9rem;

    &:hover {
      background: #094771;
    }
  }

  .divider {
    height: 1px;
    background: #333;
    margin: 4px 0;
  }

  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9998;
  }
</style>