# Tauri + SvelteKit + TypeScript

This template should help get you started developing with Tauri, SvelteKit and
TypeScript in Vite.

## Recommended IDE Setup (for VSCode)

[VS Code](https://code.visualstudio.com/) + 
[Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) + 
[Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + 
[rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Running it

- Windows:

> `bun run tauri dev`

- Linux:

> `bun run devel` - tested on kde/eos and will work only with kde (it depends on kdotool)

# ToDo
- [x] Repair the layout (controls don't need that much space)

## General functionality

- [x] Add the ability to change the date of view
- [ ] Add ability to change some of the data from the frontend (editing)
- [ ] Figure out categorization?
  - Probably via parent process
- [X] Add ability to pause tracking (will need IPC call)
- [ ] Add dialog to either close the program (exit) or minimize it (hide) upon pressing exit button

## Visualization

- [x] Remove Gantt timeline
- [x] Remove longestTasks and related code from Provider or elsewhere
- [x] Figure out a different way of visualizing the data
- [x] Add [stacked bar chart](https://www.chartjs.org/docs/latest/samples/bar/stacked.html)
- [ ] Overhaul UI/UX to a more unified vision

## Name resolving

- [ ] Add steam name resolver
  - [ ] There is something, but does it work?
- [x] Figure out name resolving of PWA
  - Seems to be issue on Vivaldi and any PWA
  - `Vivaldi-bobcidbgoopfnikbbgihiiihapdmbplc-Def` >> `Notion`
  - Or since it still uses Vivaldi group them together (the simpler solution)
- [ ] Load `mapping` from DB instead of a file
  - [ ] Also remove the file permission thing
- [ ] Test steam name resolver
- [ ] Add ability to add resolver rules from frontend

## Clean-up

- [ ] Remove unnecessary `println!` in rust code
- [ ] Remove unnecessary `console.log` in ts code
- [ ] Remove deprecated code
- [ ] Remove unused packages (mostly in node_modules / bun)

# BUGS

- [BUG]: Once closed and reopened the close button (and others) don't work
- [RESOLVED, BUG]: There is an issue with fetching data from db on reload (F5) of frontend
    - [BUG]: The loading seems to be broken when reopening from tray icon
- [RESOLVED, BUG]: Dynamic reload with new data doesn't work
- [RESOLVED, BUG]: RangeError: date value is not finite in `DateTimeFormat
  format()` in `Listing.svelte`
  - Sometimes shows up, reloading removes it?
- [BUG]: Error: [PANIC]: Expected Else value Box, but received Ok value Box.
    - in `<unknown>`
	- in `+page.svelte`
	- in `+layout.svelte`
	- in `root.svelte`
    - seems to be related to `uniqueNames_`
- [BUG]: `[Error] Unhandled Promise Rejection: window.close not allowed.` Permissions associated with this command: `core:window:allow-close`
  (@tauri-apps_api_window.js:1819)
