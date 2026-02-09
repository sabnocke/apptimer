<script lang="ts">
    let {
        value,
        disabled,
        onClick,
        onmousedown,
    }: {
        value: string
        disabled?: boolean
        onClick?: (() => void)
        onmousedown?: (() => void)
    } = $props();

    let clicked = $state<boolean>(false);
    const DEFAULT: (() => void) = () => {return;}

    function clickHandler(): void {
        clicked = !clicked
        if (clicked && onClick) {
            onClick();
        }
    }
</script>

<div>
    <button class="switch-button" onclick={clickHandler} disabled={disabled} onmousedown={(e) => {
        e.preventDefault();
        (onmousedown || DEFAULT)();
    }}>
        {value}
    </button>
</div>

<style lang="scss">
    .switch-button {
      // do something here
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }
</style>