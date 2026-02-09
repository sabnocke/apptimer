export {resolver} from "./nameResolver.svelte";
export {dataSource} from "./dataProvider.svelte";
export {
    getUniqueNames,
    getDayLogs,
    getTodayLogs,
    setLogging,
    checkAccess,
    getSteamGameName,
    loadAppDictionary,
    updateDisplayName,
    getStatsInRange,
    getDailyBreakdown,
    findWindowTitles,
    findPatternMatches,
    addRecognitionRule
} from "./ipc"
export {
    parsedDataCreator2,
    parsedDataCreatorSyn,
    selectiveSubscribe,
    timeFormatter,
    formatter,
    dateFormatter
} from "./utils";

export {selectedDate} from "./selectedDate.svelte";

export {stringToColor, type DaySegment, type ChartDay, type DailyAppStat} from "./chartUtils"
export {uiState, type ContextMenuData} from "./interactionState.svelte"