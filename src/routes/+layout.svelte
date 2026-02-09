<script lang="ts">
    import {onMount, onDestroy} from "svelte";
    import {getCurrentWindow} from "@tauri-apps/api/window";
    import {invoke} from "@tauri-apps/api/core";
    import GlobalContextMenu from "$lib/components/GlobalContextMenu.svelte";
    import GlobalModal from "$lib/components/GlobalModal.svelte";

    let unlisten: () => void = () => {return;}

    onMount(async () => {
        if (typeof window !== "undefined") {
            const appWindow = getCurrentWindow();
            unlisten = await appWindow.onCloseRequested(async (event) => {
                event.preventDefault();
                try {
                    await invoke("manual_cleanup");
                } catch (e) {
                    console.error(e);
                } finally {
                    unlisten();

                    await appWindow.close();
                }
            });
        }
    });

    onDestroy(() => {
        unlisten();
    })
</script>

<slot/>

<GlobalContextMenu />
<GlobalModal />