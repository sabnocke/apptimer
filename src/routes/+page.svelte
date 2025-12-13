<script lang="ts">
  import Base from "$lib/base.svelte"

  import {invoke} from "@tauri-apps/api/core";

  let name = $state("");
  let greetMsg = $state("");

  async function greet(event: Event) {
    event.preventDefault();
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    greetMsg = await invoke("greet", {name});
  }
</script>

<main class="container">
  <Base minTopRowHeight={450} minLeftColWidth={300}/>
</main>

<style lang="scss">
  :root {
    font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 24px;
    font-weight: 400;

    color: #0f0f0f;
    background-color: #f6f6f6;

    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;

    margin: 0;
  }

  :global(html, body) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }

  .container {
    padding: 0 !important;
    display: flex;
    align-items: center;
    justify-content: center;
    //margin: 10px;
    height: 100dvh;
    width: 100dvw;
    overflow: hidden;

  }
</style>
