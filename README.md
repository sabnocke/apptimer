# Tauri + SvelteKit + TypeScript

## Running it

- Windows:
> `bun run tauri dev`

- Linux:
> `bun run devel` - tested on kde/eos and will work only with kde (it depends on kdotool)

# ToDo

## General functionality

- [x] Add the ability to change the date of view
- [ ] Add ability to change some of the data from the frontend (editing)
- [X] Add ability to pause tracking (will need IPC call)
- [ ] Add dialog to either close the program (exit) or minimize it (hide) upon pressing exit button
- [ ] Add inactivity check

## Visualization

- [x] Remove Gantt timeline
- [x] Remove longestTasks and related code from Provider or elsewhere
- [x] Figure out a different way of visualizing the data
- [x] Add [stacked bar chart](https://www.chartjs.org/docs/latest/samples/bar/stacked.html)
- [ ] Overhaul UI/UX to a more unified vision
- [ ] Make stacked bars closer to each other (and place them to the right)
- [ ] Change how past viewing work
  - Maybe entirely different visualization?

## Name resolving

- [X] Add steam name resolver
  - There is something, but does it work?
- [x] Figure out name resolving of PWA
  - `Vivaldi-bobcidbgoopfnikbbgihiiihapdmbplc-Def` >> `Notion`
- [X] Add ability to add resolver rules from frontend
  - `config.yaml` solves resolver rules issue

## Clean-up

- [ ] Remove unnecessary `println!` in rust code
- [ ] Remove unnecessary `console.log` in ts code
- [ ] Remove deprecated code
- [ ] Remove unused packages (mostly in node_modules / bun)
- [ ] Remove unused IPC calls
  - `getTodayLogs`
  - `getDayLogs`
  - `checkAccess`
  - `getSteamGameName`
  - `fetchSteamGameData`
  - `loadAppDictionary`
  - `updateDisplayName`
  - `getStatsInRange`
  - `addRecognitionRule`
  - `getDailyBreakdown`
  - `findWindowTitles`
  - `findPatternMatches`
- [ ] With IPC calls removed, also remove unused db tables
- [ ] Remove `dataDisplay/` route

## QOL
- [ ] Add documentation strings
  - [ ] engine.svelte.ts
  - [ ] interfaces.ts
  - [ ] chartUtils.ts
  - [ ] dataProvider.svelte.ts
  - [ ] ipc.ts
  - [ ] nameResolver.svelte.ts
  - [ ] selectedDate.svelte.ts
  - [ ] settings.svelte.ts
  - [ ] utils.ts

# BUGS

- [BUG]: Once closed and reopened the close button (and others) don't work
- [RESOLVED, BUG]: There is an issue with fetching data from db on reload (F5) of frontend
    - [BUG]: The loading seems to be broken when reopening from tray icon
- [RESOLVED, BUG]: Dynamic reload with new data doesn't work
- [RESOLVED, BUG]: RangeError: date value is not finite in `DateTimeFormat
  format()` in `Listing.svelte`
  - Sometimes shows up, reloading removes it?
- [RESOLVED, BUG]: Error: [PANIC]: Expected Else value Box, but received Ok value Box.
    - in `<unknown>`
	- in `+page.svelte`
	- in `+layout.svelte`
	- in `root.svelte`
    - seems to be related to `uniqueNames_`
- [BUG]: `[Error] Unhandled Promise Rejection: window.close not allowed.` Permissions associated with this command: `core:window:allow-close`
  (@tauri-apps_api_window.js:1819)

- [BUG]: Error Found version mismatched Tauri packages. Make sure the NPM package and Rust crate versions are on the same major/minor releases:
  - tauri (v2.11.3) : @tauri-apps/api (v2.9.1)
  - tauri-plugin-sql (v2.4.0) : @tauri-apps/plugin-sql (v2.3.1)
  - tauri-plugin-fs (v2.5.1) : @tauri-apps/plugin-fs (v2.4.4)
  
