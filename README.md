# Tauri + SvelteKit + TypeScript

This template should help get you started developing with Tauri, SvelteKit and TypeScript in Vite.

## Recommended IDE Setup (for VSCode)

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer).


## Running it

- Windows:
> `bun run tauri dev`

- Linux:
> `bun run devel` - tested on *kde/eos* and will work only with kde (it depends on *kdotool*)

# ToDo

- [X] Repair the layout (controls don't need that much space)
- [ ] Add the ability to change date
- [ ] Add steam name resolver
- [ ] ?Add treemap for monthly view
- [ ] What's next?
- [ ] Add ability to change some of the data from the frontend
- [ ] Figure out categorization
- [X] Remove Gantt timeline
- [ ] Remove `longestTasks` and related code from `Provider` or elsewhere
- [ ] Operate directly with `Provider`'s `data`
- [ ] Figure out different ways of visualizing the data
    - If any are needed
- [ ] Boxes might not be necessary anymore
     
# BUGS
- [BUG]: Once closed and reopened the close button (and others) don't work
    - Resizing seems to repair the issue
- [RESOLVED, BUG]: There is an issue with fetching data from db on reload (F5) of frontend
- [RESOLVED, BUG]: Dynamic reload with new data doesn't work
- [RESOLVED, BUG]: `RangeError: date value is not finite in DateTimeFormat format()` in `Listing.svelte`
  - Sometimes shows up, reloading removes it?
