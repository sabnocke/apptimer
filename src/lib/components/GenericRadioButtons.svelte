<script lang="ts">
    type Changeable = (() => void) | Array<() => void> | Array<[string, () => void]>

    let {
        names,
        checked,
        selected = $bindable(""),
        onchange,
    } : {
        names: string[],
        checked: string
        selected: string
        onchange?: Changeable | null
    } = $props();

    function* zip<A, B>(one: ArrayLike<A>, two: ArrayLike<B> | B): Generator<[A, B], void, unknown> {

        const isCollection: boolean =
            two != null &&
            typeof (two as any).length === "number" &&
            typeof two !== "function";

        const len = isCollection ? (two as ArrayLike<B>).length : Infinity;
        const limit = Math.min(one.length, len);

        for (let i = 0; i < limit; i++) {
            if (isCollection) {
                yield [one[i], (two as ArrayLike<B>)[i]];
            } else {
                yield [one[i], two as B];
            }
        }
    }

    const displayData: [string, undefined | (() => void)][] = $derived.by(() => {
        if (Array.isArray(onchange) && Array.isArray(onchange[0])) {
            Array.from(onchange as Array<[string, () => void]>);
        }

        const handlers = (Array.isArray(onchange) && onchange.length === 0)
            ? undefined
            : (onchange as (() => void) | Array<() => void>);

        return Array.from(zip(names, handlers));
    });

    type HasCheck = Event & {
        currentTarget: (EventTarget & HTMLInputElement)
    };

    let contains = $derived(names.includes(checked));
    $effect(() => {
        selected = contains ? checked : "";
    });

    function setSelected(event: HasCheck, value: string) {
        selected = event.currentTarget.checked ? value : "";
    }
</script>

<div class="radio-buttons">
    {#each displayData as [name, onchange], i}

        <label class="radio">
            <input type="radio"
                   name="radio"
                   checked={name === checked}
                   onchange={(e) => {
                       setSelected(e, name);
                       if (onchange) onchange();
                   }}>
            <span class="name">{name}-{i}</span>
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
      width: 100px;
      font-size: 14px;

      .radio {
        flex: 1 1 auto;
        text-align: center;

        input {
          display: none;

          &:checked + .name {
            background-color: white;
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
          padding: 0.5rem 0;
          color: rgba(51, 65, 85, 1);
          transition: all 0.15s ease-in-out;
        }
      }
    }
</style>