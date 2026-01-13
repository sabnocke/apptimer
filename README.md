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
- [ ] Instead of hiding destroy frontend and then rebuild it
    - Might help with one of the bugs
    - Could be also good to see the performance of it
     
# BUGS
- [BUG]: Once closed and reopened the close button (and others) don't work
    - Resizing seems to repair the issue
- [RESOLVED, BUG]: There is an issue with fetching data from db on reload (F5) of frontend
    - [BUG]: The loading seems to be broken when reopening from tray icon
- [RESOLVED, BUG]: Dynamic reload with new data doesn't work
- [RESOLVED, BUG]: `RangeError: date value is not finite in DateTimeFormat format()` in `Listing.svelte`
  - Sometimes shows up, reloading removes it?
- [BUG]: Error: [PANIC]: Expected Else value Box, but received Ok value Box.
    - in `<unknown>`
	- in `+page.svelte`
	- in `+layout.svelte`
	- in `root.svelte`
    - seems to be related to `uniqueNames_`    
