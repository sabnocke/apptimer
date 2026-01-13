import {AsyncBox, type GanttTask, Timing} from "$lib/types";
import {dataSource} from "$lib/services/dataProvider.svelte";

interface DisplayData {
    id: number;
    name: string;
    start: Date;
    end: Date;
    time: Timing
}

export function parsedDataCreator2() {
    return dataSource
        .uniqueNames()
        .mapLeft(all => {
            return all.map<DisplayData>((name, id) => {
                const f = dataSource.data.filter(d => d.process_name === name);
                const m = f.map(d => new Timing(d.start_time, d.end_time ?? d.temp_end_time));

                const m2 = f.map<[Date, Date | null, Date]>(d => [d.start_time, d.end_time, d.temp_end_time]);
                const begin = Math.min(...f.map(d => d.start_time.valueOf()));
                const end = Math.min(...f.map(d => (d.end_time ?? d.temp_end_time).valueOf()));
                const sum = m.reduce((acc, item) => acc.add(item), new Timing());

                if (name === "jetbrains-rustrover") {
                    console.log(m2);
                    console.log(m2.map(([a, b, c]) => (b ?? c).valueOf() - a.valueOf()));
                    console.log(m2.map(([a, b, c]) => new Timing(a, b ?? c)));
                }


                return {
                    id,
                    name,
                    start: new Date(begin),
                    end: new Date(end),
                    time: sum.resync()
                }
            });
        })
}
export function parsedDataCreatorSyn() {
    if (dataSource.getUniqueNames.length === 0) {
        return [];
    }

    return dataSource.getUniqueNames.map<DisplayData>((name, id) => {
        const f = dataSource.data.filter(d => d.process_name === name);
        const m = f.map(one => new Timing(one.start_time, (one.end_time ?? one.temp_end_time)));

        const begin = Math.min(...f.map(one => one.start_time.valueOf()));
        const end = Math.max(...f.map(one => (one.end_time ?? one.temp_end_time).valueOf()));
        const time = m.reduce((acc, item) => acc.add(item), new Timing()).resync();

        return {
            id, name, time,
            start: new Date(begin),
            end: new Date(end)
        }
    });
}