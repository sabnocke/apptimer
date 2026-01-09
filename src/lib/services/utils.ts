import {AsyncBox, type GanttTask, SuperMap, Timing} from "$lib/types";
import {dataSource} from "$lib/services/dataProvider.svelte";

interface pathListEntry {
    name: string;
    path: string;
}

export function createPathMap(...connections: [string, string][]) {
    const r = new SuperMap<string, string>();
    for (const [key, value] of connections) {
        r.set(key, value);
    }

    return r;
}

interface DisplayData {
    id: number;
    name: string;
    start: Date;
    end: Date;
    time: Timing
}

export function parsedDataCreator() {
    return dataSource.uniqueNames().mapLeft(all => {
        const boxes = all.map((name, id) => {
            const f: AsyncBox<GanttTask<number>[], any> = dataSource.longestTasks.filter(d => {
                // console.log("during longestTasks.filter");
                return d.processName === name
            });

            const m: AsyncBox<Timing[], any> = f.process(d => Timing.from_valueOf(d.from, d.to));

            const begin: AsyncBox<number, any> = f.mapLeft(arr => Math.min(...arr.map(x => x.from)));
            const end: AsyncBox<number, any> = f.mapLeft(arr => Math.max(...arr.map(x => x.to)));
            const sum: AsyncBox<Timing, any> = m
                .reduce((acc, item) => {
                    acc.add(item);
                    return acc;
                }, new Timing());

            const j = AsyncBox.join(begin, end, sum);

            // console.log(name, f, m, sum, j, a);

            return j.mapLeft<DisplayData>(([begin, end, sum]) => {
                // console.log("- check sum: ", sum, sum.resync());

                return {
                    id,
                    name,
                    start: new Date(begin),
                    end: new Date(end),
                    time: sum.resync()
                }
            })
        });

        return AsyncBox.join(...boxes)
    }).flatten();
}

export function ToSortedParsedData() {
    return parsedDataCreator().mapLeft(arr => arr.sort((a, b) => {
        const sa = a.time.collapseToSeconds();
        const sb = a.time.collapseToSeconds();
        return sb - sa;
    }))
}

export function getTotalTiming() {
    return parsedDataCreator()
        .process(v => v.time.collapseToSeconds())
        .reduce((acc, item) => acc + item, 0)
        .mapLeft(x => Timing.from_seconds(x))
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