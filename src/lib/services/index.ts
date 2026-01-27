export {resolver} from "./nameResolver.svelte";
export {dataSource} from "./dataProvider.svelte";
export {
    getUniqueNames,
    getDayLogs,
    getTodayLogs,
    setLogging,
    checkAccess,
} from "./ipc"
export {parsedDataCreator2, parsedDataCreatorSyn} from "./utils";