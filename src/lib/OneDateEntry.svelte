<script lang="ts">
    import {Timing} from "$lib/types/timing";

    let {
        name,
        time
    } : {
        name: string,
        time: Timing,
    } = $props();


    function showIfTruncated(node: HTMLElement) {
        function check() {
            if (node.scrollWidth > node.clientWidth) {
                node.setAttribute("title", node.innerText);
            } else {
                node.removeAttribute("title");
            }
        }

        check();
        window.addEventListener("resize", check);

        return {
            destroy() {
                window.removeEventListener("resize", check);
            }
        }
    }
</script>

<style lang="scss">
  .entry {
    display: grid;
    grid-template-columns: 2fr 1fr auto 1fr;
    content-visibility: auto;
    z-index: 0;

    &:not(:last-child) {
      border-bottom: black 1px solid;
    }
  }

  .separator {
    height: 100%;
    width: 2px;
    background-color: black;
  }

  .time-string {
    text-align: center;
  }

  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 5px;
    cursor: default;
  }

</style>

<div class="entry">
    <div use:showIfTruncated class="title">
        {name}
    </div>
    <span class="time-string">{time.start.toLocaleString("cs-CZ")}</span>
    <div class="separator"></div>
    <span class="time-string">{time.end.toLocaleString("cs-CZ")}</span>
</div>