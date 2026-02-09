<script lang="ts">
    import {uiState} from "$lib/services";
    import {addRecognitionRule} from "$lib/services/ipc"; // Will need ipc call for display name based on process name

    let ruleName = $state("");
    let rulePattern = $state("");

    $effect(() => {
        if (uiState.activeModal === "rule-editor" && uiState.modalData) {
            ruleName = uiState.modalData.final_name;
            rulePattern = uiState.modalData.process_key;
        }
    });

    async function handleSubmit() {
        await addRecognitionRule(uiState.modalData.process_key, rulePattern, ruleName);
        uiState.closeModal()
        // Trigger data refresh if needed
    }
</script>

{#if uiState.activeModal === "rule-editor"}
    <div class="modal-overlay"
         onclick={(e) => {
           if (e.target === e.currentTarget) uiState.closeModal();
         }}
         onkeyup={(e) => {
           if (e.target === e.currentTarget) uiState.closeModal();
         }}
         role="button"
         tabindex="0"
    >
        <div class="modal-card">
            <h2>Add Recognition Rule</h2>
            <label>
                Display Name
                <input class="values" type="text" bind:value={ruleName}>
            </label>

            <label>
                Match Pattern (SQL LIKE)
                <input class="values" type="text" bind:value={rulePattern}>
            </label>

            <div class="actions">
                <button onclick={() => uiState.closeModal()}>Cancel</button>
                <button class="primary" onclick={handleSubmit}>Save Rule</button>
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-card {
      background-color: #1e1e1e;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #444;
      width: 400px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }

    .values {
      width: 100%;
      padding: 8px;
      margin-top: 5px;
      margin-bottom: 15px;
      background-color: #2d2d2d;
      border: 1px solid #444;
      color: white;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    button.primary {
      background-color: #0e639c;
      color: white;
    }

</style>